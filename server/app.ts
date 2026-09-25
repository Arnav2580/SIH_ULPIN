import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { timingSafeEqual, randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { z } from "zod";
import { createStore } from "./store.js";
import { exportGeometry, validateCityParcel } from "./city-services.js";
export function createApp(
  store: ReturnType<typeof createStore>,
  token = process.env.OFFICER_TOKEN,
) {
  const app = express();
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "script-src": ["'self'"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "img-src": ["'self'", "data:", "blob:"],
          "connect-src": ["'self'"],
          "worker-src": ["'self'", "blob:"],
        },
      },
      strictTransportSecurity:
        process.env.NODE_ENV === "production" ? undefined : false,
    }),
  );
  app.use(express.json({ limit: "32kb" }));
  app.use(
    "/api",
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  );
  app.use((req, res, next) => {
    const id = randomUUID(),
      start = Date.now();
    res.setHeader("X-Request-Id", id);
    if (req.path.startsWith("/api")) res.setHeader("Cache-Control", "no-store");
    if (process.env.NODE_ENV === "production")
      res.on("finish", () =>
        console.log(
          JSON.stringify({
            requestId: id,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            durationMs: Date.now() - start,
          }),
        ),
      );
    next();
  });
  const authorize: express.RequestHandler = (req, res, next) => {
    const candidate = Buffer.from(
      req.headers.authorization?.replace(/^Bearer /, "") ?? "",
    );
    const expected = Buffer.from(token ?? "");
    if (
      !token ||
      candidate.length !== expected.length ||
      !timingSafeEqual(candidate, expected)
    ) {
      res
        .status(401)
        .json({ message: "A configured officer credential is required." });
      return;
    }
    next();
  };
  const yearSchema = z.coerce
    .number()
    .refine(
      (n) => [2026, 2028, 2029, 2031].includes(n),
      "Unsupported snapshot year",
    );
  app.get("/api/health", (_req, res) =>
    res.json({
      status: "ok",
      database: "connected",
      integrity: store.integrity().valid,
    }),
  );
  app.get("/api/city", (_req, res) => res.json(store.city()));
  app.get("/api/reviews", (_req, res) => res.json(store.reviews()));
  app.get("/api/audit", (_req, res) =>
    res.json({ events: store.audit(), integrity: store.integrity() }),
  );
  app.post("/api/session", authorize, (_req, res) =>
    res.json({ role: "officer" }),
  );
  app.get("/api/city/export", (req, res) => {
    const year = yearSchema.parse(req.query.year ?? 2026);
    res
      .attachment(`bhudrishti-${year}.city.json`)
      .json(exportGeometry(store.city().parcels, year));
  });
  app.get("/api/parcels/:id", (req, res) => {
    const p = store.city().parcels.find((p) => p.id === req.params.id);
    if (!p) return res.status(404).json({ message: "Parcel not found" });
    res.json(p);
  });
  app.post("/api/parcels/:id/validate", (req, res) => {
    const p = store.city().parcels.find((p) => p.id === req.params.id);
    if (!p) return res.status(404).json({ message: "Parcel not found" });
    res.json(validateCityParcel(p, yearSchema.parse(req.body.year)));
  });
  app.post("/api/reviews", authorize, (req, res) => {
    const body = z
      .object({
        parcelId: z.string(),
        note: z.string().trim().min(10).max(2000),
      })
      .strict()
      .parse(req.body);
    if (!store.city().parcels.some((p) => p.id === body.parcelId))
      return res.status(404).json({ message: "Parcel not found" });
    res.status(201).json(store.createReview(body.parcelId, body.note));
  });
  app.post("/api/reviews/:id/resolve", authorize, (req, res) => {
    const result = store.resolve(String(req.params.id));
    if (!result)
      return res
        .status(409)
        .json({ message: "Review does not exist or is already resolved" });
    res.json(result);
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ message: "API route not found" }),
  );
  app.use(express.static(resolve("dist"), { index: false }));
  app.get("/{*path}", (_req, res) => res.sendFile(resolve("dist/index.html")));
  app.use(((error, _req, res, _next) => {
    if (error instanceof z.ZodError)
      return res
        .status(400)
        .json({ message: error.issues.map((i) => i.message).join("; ") });
    if (error instanceof SyntaxError)
      return res.status(400).json({ message: "Malformed JSON body" });
    console.error(error);
    res.status(500).json({ message: "Request failed. Please retry." });
  }) as express.ErrorRequestHandler);
  return app;
}
