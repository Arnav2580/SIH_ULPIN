# City beta delivery plan

## Objective

Build an advanced, self-hostable synthetic city demonstration connecting persistent 2D land identities to versioned 3D spatial units and a property lifecycle.

## Delivered

1. Reviewed the complete repository and the two research documents in the preceding conversation. Identified static validation, placeholder hashes, lack of persistence, inactive navigation and a single hard-coded parcel.
2. Introduced a typed city domain model and a 36-parcel synthetic district with 1,044 spatial units at baseline.
3. Built a consistent cadastral SVG map and interactive Three.js city, split view, floor cutaways and unit inspection from the same records.
4. Rebuilt navigation with city explorer, searchable registry, review queue, verified audit trail and a guided demo.
5. Added SQLite persistence, authorization for review writes, transactional audit records, security headers, rate limits and input validation.
6. Replaced served placeholder validation with actual rectangular-prism geometry checks. Added CityJSON geometry export with explicit synthetic/local-coordinate provenance.
7. Packaged the frontend and API into one non-root Docker service with persistent storage, health checks, CI and a hosting runbook.
8. Tested geometry failures, authorization, invalid inputs, review resolution, database restart, build output and container startup.

## Verification limits

Native browser verification was attempted, but Accessibility/Screen Recording permissions remain pending. Do not describe the visual layout or responsive interaction as browser-verified until this is completed.

## Next acceptance stages

- Choose demo hosting and domain, deploy behind TLS, then complete browser/device review and stakeholder UAT.
- Obtain authoritative survey/registry feeds and identity-provider requirements.
- Implement named government users, legal instruments, official rights mappings and approved ingestion.
- Conduct security, accessibility, recovery and scale acceptance before processing government records.

The package is for a controlled synthetic demonstration. The production/government gates are detailed in `docs/DEPLOYMENT.md`.
