# Hosting and controlled beta deployment

## Release scope

This release is a synthetic city demonstrator with persistent administrative reviews. It can be hosted on a single Docker-capable Linux server. It is not approved to ingest authoritative land records or personal data. Hosting has not been performed; a destination, domain and operator credentials must be selected.

The same Node service serves the built frontend and API, so there is no separate production frontend proxy requirement. There are no map-provider keys, remote fonts or external scene assets. Node 22.22.0 is pinned; this release uses Node's experimental SQLite API.

## Local demonstration

```sh
npm ci
npm run dev
```

Open http://localhost:5173. The API runs on port 4000. Read-only access works without credentials. To enable administrative actions, configure a random `OFFICER_TOKEN` in the process environment before starting the server. The browser keeps the submitted token only in React memory; refreshing signs the officer out. There are no built-in credentials.

For a built local site:

```sh
npm run build
npm start
```

Open http://localhost:4000. `npm start` does not automatically load `.env`; export the variables in your shell or use a process manager's secret injection.

## Container deployment

1. Install Docker Engine and Compose on the target host.
2. Copy `.env.example` to `.env` and configure `OFFICER_TOKEN` using the host's secret-management procedure. Leave it blank for a read-only public demo. Do not place real personal data in review notes: demo reviews and audit payloads are publicly readable.
3. Run `docker compose up --build -d` from the project directory. Compose reads `.env` automatically.
4. Put an HTTPS reverse proxy in front of `127.0.0.1:4000`. For example, a Caddy site definition can use `demo.example.org { reverse_proxy 127.0.0.1:4000 }` after replacing the domain and configuring DNS. TLS setup depends on the hosting authority.
5. Verify `/api/health`, load the site, inspect a parcel, and download `/api/city/export?year=2026`.

The image runs as the non-root `node` user. Compose removes capabilities, disables privilege escalation, uses a persistent named volume and binds only to host loopback. Request limits and same-origin browser policy are enabled. The application does not trust forwarded IP headers; configure edge rate limits for public hosting. In-app limits otherwise apply to the proxy's address.

`docker compose logs app` provides structured production request logs without authorization headers or bodies. A container health probe checks the API every 30 seconds. `SIGTERM` stops accepting requests and closes the database.

## Persistence, backup and rollback

The named volume `registry-data` contains the SQLite database and WAL files. Never run multiple application replicas against this volume. No horizontal scaling is supported by this storage adapter.

For a consistent filesystem backup, stop the app using `docker compose stop app`, snapshot the entire named volume using your host/volume backup tooling, and restart with `docker compose start app`. Copying just the main SQLite file while the app runs can omit uncheckpointed WAL data. Store backups encrypted outside the serving host, test restoration to an isolated volume, and verify `/api/health` plus review counts after restore. Define retention and recovery objectives before beta use.

Tag and retain each known-good container image. Before an upgrade, back up the database and deploy to staging. Roll back by running the previous image against a compatible backup. Schema changes need versioned migrations and a rehearsed rollback before adding authoritative data.

## Government beta gates still open

- Approved hosting location and operational owner; TLS, DNS and network restrictions.
- Government OIDC/SSO, MFA and named accounts with roles. The single shared officer credential is only for controlled demonstrations, with no individual attribution.
- Authoritative ULPIN source integration, survey control, declared CRS, unit boundary evidence, data licensing and ingest approval.
- Separate rights/parties/instruments and formal redevelopment mappings. Current holder labels and sources are synthetic; resolving a review does not change a right.
- PostGIS-backed geometry, migrations and multi-user workload/load testing if the pilot grows beyond this single-node dataset.
- Independent security assessment, accessibility acceptance, operational monitoring, incident response, backup restoration and data-retention decisions.
- Real parcel geometry verification. Current validation covers axis-aligned rectangular prisms, not arbitrary cadastral polygons, BIM, surface reconstruction or general 3D topology.
- External audit anchoring/signatures. The local hash chain detects broken links but is not a blockchain, authority signature, or protection from a database administrator rewriting the database and its chain.

These are acceptance requirements, not certifications claimed by this repository.
