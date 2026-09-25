# Architecture and scope

The React client loads `/api/city` into one typed model. The SVG cadastral view and Three.js scene read the same parcel bounds and temporal structure snapshots. Unit information is derived from the API records rather than regenerated in the viewer. A floor selector cuts the selected building, and an accessible HTML inventory exposes its four units.

The Express service serves the production frontend, validates requests with Zod, calculates rectangular-prism containment/overlap, and exports CityJSON. Guest clients can inspect the synthetic district; bearer-authenticated officers can create and resolve reviews. Unknown API routes return JSON 404 responses. Credentials are never committed or stored in browser persistence.

SQLite stores a versioned synthetic dataset, review records and append-only audit rows. Review writes and audit appends commit in a single immediate transaction. Audit records hash their action, payload, timestamp and previous hash. SQL triggers reject ordinary audit UPDATE/DELETE operations. This provides local tamper evidence, not a signed government ledger.

## Current endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Service/database availability and chain integrity |
| GET | `/api/city` | District and temporal records |
| GET | `/api/parcels/:id` | One parcel record |
| POST | `/api/parcels/:id/validate` | Validate `{year}` |
| GET | `/api/city/export?year=2026` | Download CityJSON geometry |
| POST | `/api/session` | Verify officer bearer credential |
| GET | `/api/reviews` | Synthetic review queue |
| POST | `/api/reviews` | Officer: create `{parcelId,note}` |
| POST | `/api/reviews/:id/resolve` | Officer: resolve once |
| GET | `/api/audit` | Events and verified chain status |

Supported years: 2026, 2028, 2029, 2031. The most recent version at or before the requested year is selected. Most district structures remain unchanged; P-9471 carries the disaster/redevelopment story.

## Coordinate and identity conventions

All coordinates are a synthetic local engineering grid. Internal boxes use `[xmin, ymin, zmin, xmax, ymax, zmax]`, with `y` vertical for Three.js. Export switches to horizontal XY and vertical Z, quantizes to millimetres and supplies a CityJSON transform. No EPSG identifier is assigned. IDs prefixed `DEMO` are synthetic parcel anchors; IDs prefixed `3D-DEMO` include a structure version to prevent identity reuse after reconstruction.

Export implementation references the [CityJSON 2.0 specification](https://www.cityjson.org/specs/), including integer vertices and a mandatory transform. Geometry is exported, but full external schema/conformance certification has not been claimed.

## Legacy prototype

`server/data.ts`, `server/services.ts`, `shared/types.ts`, and the old property components remain as legacy references. The current entry points are `src/App.tsx` and `server/index.ts`; neither serves the legacy hard-coded validation or placeholder export. They can be retired in a later cleanup without data migration.
