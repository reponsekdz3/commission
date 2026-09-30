# Implementation Plan: Imizi Local Dev Setup & Functionality Improvement

## Overview

This plan converts the design into a series of discrete, executable coding tasks.
Tasks flow in dependency order: environment → infra → deps → database → apps → functional
improvements. Each task produces a concrete artifact (file write, shell command, or code
change) that can be verified before moving to the next step.

All tasks are written for TypeScript / Node 24 on the monorepo at
`c:\Users\Q.C\Videos\commission\`.

---

## Tasks

- [x] 1. Create the `.env` file from `.env.example`
  - Read `.env.example` at the workspace root.
  - If `.env` already exists, exit without modifying it.
  - Copy all key-value pairs from `.env.example` to `.env`.
  - Replace `JWT_ACCESS_SECRET` with `node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"` output (≥64 hex chars).
  - Replace `JWT_REFRESH_SECRET` with a second independent random value of the same length.
  - Set `MAPS_PROVIDER=catalog`.
  - Set `SEED_PASSWORD=ImiziDev2024Seed!`.
  - Set `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`.
  - Keep all Docker service URLs pointing to localhost (`DATABASE_URL`, `REDIS_URL`, `OPENSEARCH_URL`, `S3_ENDPOINT`).
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 1.1 Write the env file using Node crypto for JWT secrets
    - Implement the env-file generation as a small inline Node script or by direct file write using `fs.readFileSync`/`fs.writeFileSync`.
    - Use `crypto.randomBytes(32).toString('hex')` for each JWT secret.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 1.2 Write unit tests for env generation logic
    - Assert `JWT_ACCESS_SECRET` length ≥ 64 chars.
    - Assert `JWT_REFRESH_SECRET` ≠ `JWT_ACCESS_SECRET`.
    - Assert `MAPS_PROVIDER === 'catalog'`.
    - Assert `SEED_PASSWORD.length >= 16`.
    - Assert `NEXT_PUBLIC_API_URL === 'http://localhost:4000/api/v1'`.
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 2. Start Docker Compose infrastructure services
  - Run `docker compose up -d postgres redis opensearch minio minio-init prometheus grafana` from the workspace root.
  - Do NOT start the `api` service (it runs locally).
  - Poll each service's health endpoint until healthy or timeout (60 s for postgres/redis/minio, 120 s for opensearch).
  - Print the name of any service that fails to become healthy and exit non-zero.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 2.1 Run `docker compose up -d` for infra services only
    - Execute: `docker compose up -d postgres redis opensearch minio minio-init prometheus grafana`
    - _Requirements: 2.1, 2.2_

  - [x] 2.2 Wait for PostgreSQL health
    - Poll `docker exec imizi-postgres pg_isready -U imizi -d imizi` every 2 s up to 60 s.
    - _Requirements: 2.3_

  - [x] 2.3 Wait for Redis health
    - Poll `docker exec imizi-redis redis-cli ping` every 2 s up to 60 s.
    - _Requirements: 2.4_

  - [x] 2.4 Wait for OpenSearch health
    - Poll `curl -sf http://localhost:9200` every 5 s up to 120 s.
    - _Requirements: 2.5_

  - [x] 2.5 Wait for MinIO health
    - Poll `curl -sf http://localhost:9000/minio/health/live` every 2 s up to 60 s.
    - _Requirements: 2.6_

- [x] 3. Install npm workspace dependencies
  - Run `npm install` at the workspace root.
  - Verify `node_modules` exists after completion.
  - If `npm install` exits non-zero, print the error and halt.
  - _Requirements: 3.1, 3.2, 3.3_

  - [x] 3.1 Execute `npm install` at workspace root
    - Run `npm install` with no extra flags — npm workspaces handles all packages.
    - _Requirements: 3.1, 3.2_

- [x] 4. Fix migration file naming conflict (rename 002_ files)
  - Rename `packages/database/sql/002_production_integrity.sql` → `002a_production_integrity.sql`.
  - Rename `packages/database/sql/002_production_persistence.sql` → `002b_production_persistence.sql`.
  - No SQL content changes are needed because every `ALTER TABLE ... ADD COLUMN` uses `IF NOT EXISTS`.
  - Verify that the renamed files sort correctly: `002a_...` before `002b_...` before `003_...`.
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 4.1 Rename `002_production_integrity.sql` to `002a_production_integrity.sql`
    - Use `fs.renameSync` or a shell `mv` / PowerShell `Rename-Item`.
    - _Requirements: 4.2, 4.3_

  - [ ] 4.2 Rename `002_production_persistence.sql` to `002b_production_persistence.sql`
    - Use `fs.renameSync` or a shell `mv` / PowerShell `Rename-Item`.
    - _Requirements: 4.2, 4.4_

  - [ ]* 4.3 Write property test for migration file sorting
    - **Property 1: Migration Runner Alphabetical Ordering**
    - **Validates: Requirements 4.1, 5.2**
    - Generate random valid SQL filenames, assert `Array.sort()` produces stable lexicographic order with no duplicates.
    - Use `fast-check` with at least 100 iterations.
    - Tag: `// Feature: imizi-local-setup, Property 1: Migration Runner Alphabetical Ordering`
    - _Requirements: 4.1, 5.2_

  - [ ]* 4.4 Write property test for migration runner idempotency
    - **Property 2: Migration Runner Idempotency**
    - **Validates: Requirements 4.5, 5.2**
    - Simulate the `schema_migrations` tracking table logic; verify that a second `migrate` run on already-applied files produces zero new inserts.
    - Use `fast-check` with at least 100 iterations.
    - Tag: `// Feature: imizi-local-setup, Property 2: Migration Runner Idempotency`
    - _Requirements: 4.5, 5.2_

- [ ] 5. Apply all database migrations
  - Load `.env` variables into the shell environment.
  - Run `npm run db:migrate` (resolves to `npm run migrate -w @imizi/database`).
  - Verify the command exits with code 0 and prints `"Database migrations complete"`.
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 5.1 Run `npm run db:migrate` with DATABASE_URL set
    - Execute via shell with the `.env` variables sourced.
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 6. Seed the database
  - Run `npm run db:seed` with `DATABASE_URL` and `SEED_PASSWORD` sourced from `.env`.
  - Verify the command exits with code 0 and prints `"Seeded Imizi PostgreSQL database"`.
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ] 6.1 Run `npm run db:seed` with DATABASE_URL and SEED_PASSWORD set
    - Source `.env` before executing. `SEED_PASSWORD` must be `ImiziDev2024Seed!` (set in task 1.1).
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 6.2 Write property test for seed idempotency
    - **Property 3: Seed Idempotency**
    - **Validates: Requirements 6.2, 6.3**
    - Run seed twice; assert user count with the 4 deterministic UUIDs = 4, property count with the 5 deterministic UUIDs = 5.
    - Use `fast-check` with at least 100 iterations.
    - Tag: `// Feature: imizi-local-setup, Property 3: Seed Idempotency`
    - _Requirements: 6.2, 6.3_

  - [ ]* 6.3 Write property test for search.index job deduplication
    - **Property 4: Search Index Job Deduplication**
    - **Validates: Requirements 6.4, 13.1**
    - Run seed N times; assert `COUNT(*) WHERE name='search.index' AND status IN ('PENDING','RUNNING')` per listing never exceeds 1.
    - Use `fast-check` with at least 100 iterations.
    - Tag: `// Feature: imizi-local-setup, Property 4: Search Index Job Deduplication`
    - _Requirements: 6.4, 13.1_

- [ ] 7. Checkpoint — Verify database state
  - Run `npm run db:smoke` with `DATABASE_URL` sourced from `.env`.
  - Verify output JSON shows `users >= 4`, `properties >= 5`, `listings >= 5`, `locations === properties`.
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 7.1 Run `npm run db:smoke` and verify output
    - Execute the smoke script; parse stdout JSON to confirm all counts meet minimums.
    - _Requirements: 7.1, 7.2_

- [ ] 8. Add `engine` field to the health endpoint
  - Open `apps/api/src/modules/health/health.controller.ts`.
  - In the `snapshot()` private method, add `engine: this.deps.searchOk ? "opensearch" : "postgres-postgis"` to the returned object.
  - This satisfies Requirement 12.8 (the field is currently absent from the response).
  - Rebuild the API with `npm run typecheck -w @imizi/api` to verify no type errors.
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

  - [ ] 8.1 Add `engine` field to `HealthController.snapshot()`
    - Edit `apps/api/src/modules/health/health.controller.ts`, inserting `engine` into the return object of the `snapshot()` method.
    - _Requirements: 12.8_

  - [ ]* 8.2 Write integration test for health endpoint response shape
    - Call `GET /health` with the running API; assert all fields (`status`, `api`, `database`, `redis`, `search`, `storage`, `properties`, `listings`, `engine`) are present with correct types.
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

- [ ] 9. Add `propertyType` and `district` filter controls to `PropertyFilters`
  - Open `apps/web/components/property/property-filters.tsx`.
  - Add a `propertyType` local state variable; initialise from `params.get("propertyType")`.
  - Add a `<select>` control inside the filter panel listing values: `HOUSE`, `APARTMENT`, `APARTMENT_BUILDING`, `VILLA`, `LAND`, `SHOP`, `WAREHOUSE`, `OFFICE`, `COMMERCIAL`.
  - On change, call `router.replace` with `propertyType=<value>` added to the query string using the existing `apply()` pattern.
  - Add a `district` local state variable; initialise from `params.get("district")`.
  - Add a `<select>` control populated from `GET /api/v1/locations/rwanda?level=DISTRICT` fetched inside the component with `useEffect` on mount.
  - On change, call `router.replace` with `district=<value>` added to the query string.
  - Update the `clear()` function to also delete `propertyType` and `district` from the URL params.
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ] 9.1 Add `propertyType` select control to `PropertyFilters`
    - Add state, JSX select element with enum options, and `apply()` call on change.
    - _Requirements: 10.1_

  - [ ] 9.2 Add `district` select control to `PropertyFilters`
    - Add state, `useEffect` to fetch districts from `/locations/rwanda?level=DISTRICT`, and `apply()` call on change.
    - _Requirements: 10.1_

  - [ ]* 9.3 Write property test for search bedrooms filter invariant
    - **Property 5: Search Bedrooms Filter Invariant**
    - **Validates: Requirements 10.2**
    - Use `fast-check` to generate random `bedroomsMin` values and mock result sets; assert every result has `bedrooms >= bedroomsMin`.
    - At least 100 iterations.
    - Tag: `// Feature: imizi-local-setup, Property 5: Search Bedrooms Filter Invariant`
    - _Requirements: 10.2_

  - [ ]* 9.4 Write property test for search price filter invariant
    - **Property 6: Search Price Filter Invariant**
    - **Validates: Requirements 10.3**
    - Use `fast-check` to generate random `maxPriceMinor` values and mock result sets; assert every result has `priceMinor <= maxPriceMinor`.
    - At least 100 iterations.
    - Tag: `// Feature: imizi-local-setup, Property 6: Search Price Filter Invariant`
    - _Requirements: 10.3_

  - [ ]* 9.5 Write property test for search verified filter invariant
    - **Property 7: Search Verified Filter Invariant**
    - **Validates: Requirements 10.4**
    - Use `fast-check` to generate random result sets with mixed `verificationStatus` values; assert all results have `verificationStatus === 'VERIFIED'` when filter is on.
    - At least 100 iterations.
    - Tag: `// Feature: imizi-local-setup, Property 7: Search Verified Filter Invariant`
    - _Requirements: 10.4_

- [ ] 10. Create `apps/web/lib/format.ts` with property-type label utilities
  - Create (or open if already exists) `apps/web/lib/format.ts`.
  - Export a `PROPERTY_TYPE_LABELS` map with human-readable strings for all enum values:
    `HOUSE → "House"`, `APARTMENT → "Apartment"`, `APARTMENT_BUILDING → "Apartment Building"`,
    `VILLA → "Villa"`, `LAND → "Land"`, `SHOP → "Shop"`, `WAREHOUSE → "Warehouse"`,
    `OFFICE → "Office"`, `COMMERCIAL → "Commercial"`.
  - Export a `formatPropertyType(type: string): string` helper that looks up the map and falls back to the raw value.
  - _Requirements: 11.1_

  - [ ] 10.1 Write `PROPERTY_TYPE_LABELS` map and `formatPropertyType` helper
    - Create `apps/web/lib/format.ts` with the exported map and helper function.
    - _Requirements: 11.1_

- [ ] 11. Enrich the property detail page
  - Open `apps/web/app/properties/[id]/page.tsx`.
  - Import `formatPropertyType` from `../../../lib/format`.
  - Sort the `media` array by `sort_order` ascending before passing to `PropertyGallery`.
  - Replace the raw `p.propertyType` pill text with `formatPropertyType(p.propertyType ?? "")`.
  - Verify that `BookingPanel` receives the correct `listingId` from `l.id` (already wired — confirm and add a comment).
  - Verify that the `<a href={"/booking/new?listingId="+l.id}>` in the sticky bottom bar is present and correct.
  - Run `npm run typecheck -w @imizi/web` to verify no type errors.
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

  - [ ] 11.1 Sort media by sort_order and apply formatPropertyType label
    - Add `media.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))` before the `filter()` call.
    - Replace raw `p.propertyType` with `formatPropertyType(p.propertyType ?? "")` in the pill span.
    - _Requirements: 11.1, 11.2_

  - [ ]* 11.2 Write unit tests for formatPropertyType helper
    - Assert every defined enum value maps to a non-empty human-readable string.
    - Assert unknown values fall back to the raw input.
    - _Requirements: 11.1_

- [ ] 12. Verify homepage data loading
  - Open `apps/web/app/page.tsx` (already implemented with `try/catch` API calls).
  - Verify that the search API response includes `media` with a `url` field for each item (check that `DatabaseService.searchListings` returns `storage_key` mapped to `url`).
  - If the search endpoint's DB query returns `storage_key` without a `url` alias, add a `url` alias to the SQL SELECT in `packages/database/src/index.ts` or the relevant query method.
  - Run `npm run typecheck -w @imizi/web` to verify no type errors.
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [ ] 12.1 Audit and fix `media.url` mapping in the search endpoint database query
    - Read `packages/database/src/index.ts` `searchListings` method.
    - Confirm the `property_media` join includes `storage_key AS url` (or `url` directly).
    - If missing, add the alias so `media[0].url` is populated in search results.
    - _Requirements: 14.4, 14.5_

- [ ] 13. Start the API and Web applications
  - Start the API: `npm run dev:api` as a background process.
  - Wait up to 30 s for `GET http://localhost:4000/health` to return HTTP 200.
  - Verify the JSON response includes `database: true`, `redis: true`, and an `engine` field.
  - Start the Web: `npm run dev:web` as a background process.
  - Wait up to 60 s for `GET http://localhost:3000` to return HTTP 200.
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1, 9.2, 9.3_

  - [ ] 13.1 Start `npm run dev:api` and verify health endpoint
    - Start the API process (background). Poll `http://localhost:4000/health` every 2 s.
    - Assert `status === "ok"`, `database === true`, `redis === true`.
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 13.2 Start `npm run dev:web` and verify homepage response
    - Start the Web process (background). Poll `http://localhost:3000` every 3 s up to 60 s.
    - Assert HTTP 200 response.
    - _Requirements: 9.1, 9.2_

- [ ] 14. Final checkpoint — Verify full stack is running
  - Confirm API health: `curl http://localhost:4000/health` returns `engine` field.
  - Confirm search returns results: `curl "http://localhost:4000/api/v1/search?listingType=RENT&limit=5"` returns `items` array with at least 1 result.
  - Confirm homepage loads data: `curl http://localhost:3000` returns a non-empty HTML response.
  - Confirm JobsService has processed `search.index` jobs (query `background_jobs` table for `status='DONE'`).
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 8.3, 8.6, 9.3, 13.2, 13.4_

  - [ ] 14.1 Verify API search endpoint returns results with engine field
    - Call `GET /api/v1/search?listingType=RENT&limit=5`; assert `items.length >= 1` and `engine` is present.
    - _Requirements: 13.4, 12.8_

  - [ ]* 14.2 Write integration test for OpenSearch indexing end-to-end
    - After seed + API start, call search API and assert `engine === "opensearch"`.
    - _Requirements: 13.2, 13.4_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster initial setup.
- Each task references specific requirements from `requirements.md` for full traceability.
- Checkpoints at tasks 7 and 14 validate cumulative state before proceeding.
- Property tests use `fast-check` (minimum 100 iterations each).
- Task 4 (migration rename) must complete before task 5 (db:migrate) to avoid the `002_` conflict.
- Task 1 must complete before task 6 (seeding) because `SEED_PASSWORD` must be in `.env`.
- Tasks 8–12 (functional improvements) can run in parallel with each other once deps are installed.
- The `engine` field added in task 8 is a one-line change to an existing method.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5"] },
    { "id": 3, "tasks": ["4.1", "4.2"] },
    { "id": 4, "tasks": ["4.3", "4.4", "5.1"] },
    { "id": 5, "tasks": ["6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "7.1"] },
    { "id": 7, "tasks": ["8.1", "9.1", "9.2", "10.1", "11.1", "12.1"] },
    { "id": 8, "tasks": ["1.2", "8.2", "9.3", "9.4", "9.5", "10.1", "11.2"] },
    { "id": 9, "tasks": ["13.1"] },
    { "id": 10, "tasks": ["13.2"] },
    { "id": 11, "tasks": ["14.1"] },
    { "id": 12, "tasks": ["14.2"] }
  ]
}
```
