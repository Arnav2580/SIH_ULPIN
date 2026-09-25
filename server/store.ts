import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { seedCity } from "./city-data.js";
import type { Audit, CityData, Review } from "../shared/city.js";
// Load at the server boundary; browser-like test transforms do not yet know
// Node 22's new sqlite builtin. This module is never imported by client code.
const { DatabaseSync } = createRequire(import.meta.url)(
  "node:sqlite",
) as typeof import("node:sqlite");
export function createStore(
  path = process.env.DB_PATH ?? "data/bhudrishti.sqlite",
) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS datasets (id TEXT PRIMARY KEY, body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, parcelId TEXT NOT NULL, note TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('Pending','Resolved')), createdAt TEXT NOT NULL, resolvedAt TEXT);
    CREATE TABLE IF NOT EXISTS audit (sequence INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, payload TEXT NOT NULL, createdAt TEXT NOT NULL, previousHash TEXT NOT NULL, hash TEXT NOT NULL);
    CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit BEGIN SELECT RAISE(ABORT,'Audit rows are append only'); END;
    CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit BEGIN SELECT RAISE(ABORT,'Audit rows are append only'); END;`);
  db.prepare("INSERT OR IGNORE INTO datasets VALUES (?,?)").run(
    "city-v2",
    JSON.stringify(seedCity()),
  );
  const city = () =>
    JSON.parse(
      (
        db.prepare("SELECT body FROM datasets WHERE id=?").get("city-v2") as {
          body: string;
        }
      ).body,
    ) as CityData;
  const audit = () =>
    db
      .prepare("SELECT * FROM audit ORDER BY sequence")
      .all() as unknown as Audit[];
  const digest = (
    r: Pick<Audit, "action" | "payload" | "createdAt" | "previousHash">,
  ) =>
    createHash("sha256")
      .update(
        JSON.stringify([r.action, r.payload, r.createdAt, r.previousHash]),
      )
      .digest("hex");
  function append(action: string, payload: unknown) {
    const last = db
      .prepare("SELECT hash FROM audit ORDER BY sequence DESC LIMIT 1")
      .get() as { hash: string } | undefined;
    const record = {
      action,
      payload: JSON.stringify(payload),
      createdAt: new Date().toISOString(),
      previousHash: last?.hash ?? "GENESIS",
    };
    db.prepare(
      "INSERT INTO audit(action,payload,createdAt,previousHash,hash) VALUES (?,?,?,?,?)",
    ).run(
      record.action,
      record.payload,
      record.createdAt,
      record.previousHash,
      digest(record),
    );
  }
  function transaction<T>(fn: () => T) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const value = fn();
      db.exec("COMMIT");
      return value;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  if (!audit().length)
    append("DATASET_INITIALIZED", {
      synthetic: true,
      parcels: city().parcels.length,
    });
  return {
    city,
    audit,
    close: () => db.close(),
    integrity: () => {
      const rows = audit();
      return {
        valid: rows.every(
          (r, i) =>
            r.previousHash === (i ? rows[i - 1].hash : "GENESIS") &&
            r.hash === digest(r),
        ),
        events: rows.length,
        head: rows.at(-1)?.hash,
      };
    },
    reviews: () =>
      db
        .prepare("SELECT * FROM reviews ORDER BY createdAt DESC")
        .all() as unknown as Review[],
    createReview: (parcelId: string, note: string) =>
      transaction(() => {
        const r: Review = {
          id: randomUUID(),
          parcelId,
          note,
          status: "Pending",
          createdAt: new Date().toISOString(),
          resolvedAt: null,
        };
        db.prepare("INSERT INTO reviews VALUES (?,?,?,?,?,?)").run(
          r.id,
          r.parcelId,
          r.note,
          r.status,
          r.createdAt,
          r.resolvedAt,
        );
        append("REVIEW_CREATED", r);
        return r;
      }),
    resolve: (id: string) =>
      transaction(() => {
        const r = db
          .prepare("SELECT * FROM reviews WHERE id=?")
          .get(id) as unknown as Review | undefined;
        if (!r || r.status !== "Pending") return null;
        const resolvedAt = new Date().toISOString();
        db.prepare("UPDATE reviews SET status=?,resolvedAt=? WHERE id=?").run(
          "Resolved",
          resolvedAt,
          id,
        );
        append("REVIEW_RESOLVED", { id, parcelId: r.parcelId, resolvedAt });
        return { ...r, status: "Resolved", resolvedAt };
      }),
  };
}
