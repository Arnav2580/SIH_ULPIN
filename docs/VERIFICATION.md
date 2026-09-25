# Verification record

## User story

A reviewer opens the city, selects a 2D parcel, follows it to a property record, changes the temporal snapshot, validates geometry and then uses officer access to submit and resolve an observation backed by a persistent audit trail.

## Evidence

| Boundary | Evidence | Limit |
|---|---|---|
| UI → API → SQLite | Three Testing Library tests drive the real React app through the real Express handlers via Supertest; parcel selection/search, lifecycle validation and authenticated review resolution pass | GPU surface is replaced for these DOM tests |
| Geometry rules | Deliberately overlapping and outside volumes are rejected; shared faces pass | Rectangular prisms only |
| Access controls | Unauthenticated writes return 401; malformed inputs return 400; repeated resolution returns 409 | Shared demo credential, not named-user government SSO |
| Persistence | A review survives database close/reopen and the chain remains valid | Single-node SQLite |
| Export | Parcel surfaces and unit solids emitted with integer vertices and a 0.001 transform | External full conformance validation pending |
| Production package | TypeScript/Vite build and Docker image build; running image responds 200 for homepage and health API | Public deployment not performed |
| Dependencies | npm audit reports zero known vulnerabilities after updating Vitest | Point-in-time package audit, not a penetration test |
| Browser / device | Native browser access attempted twice | Blocked by pending Accessibility and Screen Recording permissions; visual and WebGL QA not complete |

The suite contains 11 tests: six city/API/persistence tests, three UI-to-API integration tests and two retained legacy service tests. No report of successful browser screenshots or government certification is implied.
