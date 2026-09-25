import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { seedCity } from "./city-data.js";
import { validateCityParcel, exportGeometry } from "./city-services.js";
import { createStore } from "./store.js";
import { createApp } from "./app.js";
import { atYear } from "../shared/city.js";
const stores: ReturnType<typeof createStore>[] = [];
afterEach(() => {
  stores.splice(0).forEach((s) => s.close());
});
describe("district geometry and temporal identity", () => {
  it("keeps the base parcel and historical unit identities through demolition", () => {
    const p = seedCity().parcels[0];
    expect(atYear(p, 2026).units).toHaveLength(48);
    expect(atYear(p, 2029).units).toHaveLength(0);
    expect(atYear(p, 2031).units).toHaveLength(12);
    expect(atYear(p, 2026).units[0].id).not.toBe(atYear(p, 2031).units[0].id);
    expect(p.versions[0].units).toHaveLength(48);
  });
  it("detects overlapping and outside solids, not shared faces", () => {
    const p = seedCity().parcels[0];
    expect(
      validateCityParcel(p, 2026).checks.find((c) => c.id === "overlap")
        ?.status,
    ).toBe("pass");
    p.versions[0].units[1].bounds = [...p.versions[0].units[0].bounds];
    p.versions[0].units[2].bounds[0] = p.x - 100;
    const result = validateCityParcel(p, 2026);
    expect(result.checks.find((c) => c.id === "overlap")?.status).toBe("fail");
    expect(result.checks.find((c) => c.id === "containment")?.status).toBe(
      "fail",
    );
  });
  it("exports quantized solid geometry and leaves fabricated CRS out", () => {
    const data = exportGeometry(seedCity().parcels, 2026);
    expect(Object.keys(data.CityObjects).length).toBeGreaterThan(36);
    expect(data.vertices.every((v) => v.every(Number.isInteger))).toBe(true);
    expect(data.transform.scale).toEqual([0.001, 0.001, 0.001]);
    expect(data.metadata).not.toHaveProperty("referenceSystem");
  });
});
describe("API authorization, persistence and transactional audit", () => {
  it("denies unauthenticated writes, validates inputs and resolves once", async () => {
    const store = createStore(":memory:");
    stores.push(store);
    const app = createApp(store, "test-officer");
    await request(app)
      .post("/api/reviews")
      .send({ parcelId: "P-9471", note: "Please verify this record" })
      .expect(401);
    await request(app)
      .post("/api/reviews")
      .auth("test-officer", { type: "bearer" })
      .send({ parcelId: "P-9471", note: "short" })
      .expect(400);
    const { body: r } = await request(app)
      .post("/api/reviews")
      .auth("test-officer", { type: "bearer" })
      .send({ parcelId: "P-9471", note: "Please verify this record" })
      .expect(201);
    await request(app)
      .post("/api/reviews/" + r.id + "/resolve")
      .auth("test-officer", { type: "bearer" })
      .send({})
      .expect(200);
    await request(app)
      .post("/api/reviews/" + r.id + "/resolve")
      .auth("test-officer", { type: "bearer" })
      .send({})
      .expect(409);
    expect(store.integrity()).toMatchObject({ valid: true, events: 3 });
    expect(store.reviews()[0].status).toBe("Resolved");
  });
  it("rejects invalid years and missing parcels with useful errors", async () => {
    const store = createStore(":memory:");
    stores.push(store);
    const app = createApp(store);
    await request(app)
      .post("/api/parcels/P-9471/validate")
      .send({ year: 2027 })
      .expect(400);
    await request(app)
      .post("/api/parcels/missing/validate")
      .send({ year: 2026 })
      .expect(404);
    const { body } = await request(app)
      .post("/api/parcels/P-9471/validate")
      .send({ year: 2031 })
      .expect(200);
    expect(
      body.checks.find((c: { id: string }) => c.id === "rights").status,
    ).toBe("review");
  });
  it("survives a database restart with its audit chain intact", () => {
    const path = join(
      mkdtempSync(join(tmpdir(), "bhudrishti-test-")),
      "test.sqlite",
    );
    const first = createStore(path);
    const r = first.createReview("P-9471", "Persistent review observation");
    first.close();
    const second = createStore(path);
    stores.push(second);
    expect(second.reviews()[0].id).toBe(r.id);
    expect(second.integrity()).toMatchObject({ valid: true, events: 2 });
  });
});
