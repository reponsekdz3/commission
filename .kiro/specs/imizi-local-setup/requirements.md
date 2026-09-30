# Requirements Document

## Introduction

This document captures the requirements for bringing the **Imizi** Rwanda-first real estate
marketplace monorepo to a fully operational local development environment and improving key
application functionality. The work spans six phases:

1. **Environment** — create a working `.env` file from the example template
2. **Infrastructure** — start all Docker-managed backing services
3. **Dependencies** — install all npm workspace packages
4. **Database** — fix migration ordering conflicts, apply all migrations, seed, and smoke-test
5. **Applications** — start the NestJS API and Next.js web app and verify both are reachable
6. **Functional improvements** — fix the migration conflict, improve the search page filters,
   enrich the property detail page, harden the health endpoint, bootstrap OpenSearch, and
   improve the homepage

The system consists of `apps/api` (NestJS 11, port 4000), `apps/web` (Next.js 15, port 3000),
and the Docker Compose-managed backing services: PostgreSQL/PostGIS 16, Redis 7,
OpenSearch 2.17.1, MinIO, Prometheus, and Grafana.

---

## Glossary

- **Dev_Setup**: The automated local development environment configuration and startup process
- **Migration_Runner**: The CJS script at `packages/database/src/migrate.cjs` that applies numbered `.sql` files in alphabetical order
- **Seed_Script**: The CJS script at `packages/database/src/seed.cjs` that populates deterministic test data
- **Smoke_Script**: The CJS script at `packages/database/src/smoke.cjs` that verifies seeded data exists
- **API**: The NestJS 11 application in `apps/api`, served on port 4000
- **Web**: The Next.js 15 application in `apps/web`, served on port 3000
- **Health_Endpoint**: The `/health` route handled by `HealthController` in the API
- **Search_Service**: The `SearchService` class in `apps/api/src/modules/search/search.service.ts`
- **JobsService**: The background job poller in `apps/api/src/modules/jobs/` that runs every 5 seconds
- **OpenSearch**: The search engine container `imizi-opensearch` at port 9200
- **PostgreSQL**: The PostGIS-enabled database container `imizi-postgres` at port 5432
- **Redis**: The cache/session store container `imizi-redis` at port 6379
- **MinIO**: The S3-compatible object store container `imizi-minio` at ports 9000/9001
- **Search_Index_Job**: A `background_jobs` row with `name = 'search.index'` that the JobsService processes to index a listing into OpenSearch
- **PropertyFilters**: The React component `apps/web/components/property/property-filters.tsx` rendered on the search page
- **SearchPage**: The Next.js page at `apps/web/app/search/page.tsx`
- **PropertyDetailPage**: The Next.js page at `apps/web/app/properties/[id]/page.tsx`
- **Homepage**: The Next.js page at `apps/web/app/page.tsx`
- **BookingPanel**: The React component `apps/web/components/property/booking-panel.tsx` that surfaces CTAs on the property detail page
- **EARS**: Easy Approach to Requirements Syntax — the pattern language used throughout this document

---

## Requirements

### Requirement 1: Environment File Creation

**User Story:** As a developer, I want a complete `.env` file generated from `.env.example`, so that all applications and scripts have the environment variables they need to run locally.

#### Acceptance Criteria

1. WHEN the Dev_Setup phase begins, THE Dev_Setup SHALL create a `.env` file at the workspace root by copying all keys from `.env.example`
2. WHEN the `.env` file is created, THE Dev_Setup SHALL replace `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` with randomly generated strings of at least 32 characters each
3. WHEN the `.env` file is created, THE Dev_Setup SHALL set `MAPS_PROVIDER=catalog` so that no external map token is required for local development
4. WHEN the `.env` file is created, THE Dev_Setup SHALL set `SEED_PASSWORD` to a value of at least 16 characters so that the Seed_Script can execute successfully
5. WHEN the `.env` file is created, THE Dev_Setup SHALL set `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1` so that the Web application can reach the API
6. WHEN the `.env` file is created, THE Dev_Setup SHALL set all Docker service URLs (`DATABASE_URL`, `REDIS_URL`, `OPENSEARCH_URL`, `S3_ENDPOINT`) to their localhost equivalents
7. IF the `.env` file already exists, THEN THE Dev_Setup SHALL preserve the existing file without overwriting it

---

### Requirement 2: Infrastructure Services

**User Story:** As a developer, I want all required Docker backing services started and healthy, so that the API and Web applications can connect to their dependencies.

#### Acceptance Criteria

1. WHEN the infrastructure phase begins, THE Dev_Setup SHALL start the `postgres`, `redis`, `opensearch`, `minio`, `minio-init`, `prometheus`, and `grafana` Docker Compose services
2. WHEN the infrastructure phase begins, THE Dev_Setup SHALL NOT start the `api` Docker Compose service because the API runs locally via `npm run dev:api`
3. WHEN services are started, THE Dev_Setup SHALL wait until PostgreSQL reports healthy via `pg_isready -U imizi -d imizi`
4. WHEN services are started, THE Dev_Setup SHALL wait until Redis reports healthy via `redis-cli ping`
5. WHEN services are started, THE Dev_Setup SHALL wait until OpenSearch responds on `http://localhost:9200`
6. WHEN services are started, THE Dev_Setup SHALL wait until MinIO responds on `http://localhost:9000/minio/health/live`
7. IF any service fails to become healthy within its retry budget, THEN THE Dev_Setup SHALL report which service failed and exit with a non-zero code

---

### Requirement 3: Dependency Installation

**User Story:** As a developer, I want all npm workspace packages installed, so that the API, Web, and shared packages are ready to compile and run.

#### Acceptance Criteria

1. WHEN the dependency phase begins, THE Dev_Setup SHALL run `npm install` at the workspace root to install all workspace packages
2. WHEN `npm install` completes, THE Dev_Setup SHALL verify that `node_modules` exists at the workspace root
3. IF `npm install` exits with a non-zero code, THEN THE Dev_Setup SHALL report the error and halt further phases

---

### Requirement 4: Database Migration Conflict Resolution

**User Story:** As a developer, I want the database migration files to have unambiguous, stable alphabetical ordering, so that the Migration_Runner applies them in the correct sequence without errors.

#### Acceptance Criteria

1. THE Migration_Runner SHALL apply migration files in alphabetical order by filename
2. WHEN the migration set contains both `002_production_integrity.sql` and `002_production_persistence.sql`, THE Dev_Setup SHALL rename them so that `002_production_integrity.sql` becomes `002a_production_integrity.sql` and `002_production_persistence.sql` becomes `002b_production_persistence.sql`
3. WHEN the renamed migrations run in order (`002a` then `002b`), THE Migration_Runner SHALL apply `002a_production_integrity.sql` first, which adds `organization_id` (nullable) and `available_from` (nullable) to their respective tables and creates `device_push_tokens`, `reauth_tokens`, and `background_jobs` tables
4. WHEN `002b_production_persistence.sql` runs after `002a`, THE Migration_Runner SHALL apply `ADD COLUMN IF NOT EXISTS` clauses that are idempotent because the columns already exist from `002a`
5. WHEN all migrations have been applied, THE Migration_Runner SHALL record each applied filename in the `schema_migrations` table

---

### Requirement 5: Database Migration Execution

**User Story:** As a developer, I want all 9 database migrations applied cleanly, so that the schema is fully up to date before the seed runs.

#### Acceptance Criteria

1. WHEN the database phase begins, THE Dev_Setup SHALL run `npm run db:migrate` with `DATABASE_URL` set to the PostgreSQL connection string
2. WHEN `npm run db:migrate` executes, THE Migration_Runner SHALL apply every `.sql` file in `packages/database/sql/` whose filename matches `/^\d+_.*\.sql$/` and that has not already been recorded in `schema_migrations`
3. WHEN `npm run db:migrate` completes successfully, THE Migration_Runner SHALL print `"Database migrations complete"` to stdout
4. IF any migration fails, THEN THE Migration_Runner SHALL roll back the failing transaction, print the error to stderr, and exit with code 1

---

### Requirement 6: Database Seeding

**User Story:** As a developer, I want the database seeded with deterministic test users, properties, listings, and background jobs, so that the application has real data to display and search.

#### Acceptance Criteria

1. WHEN the database phase continues, THE Dev_Setup SHALL run `npm run db:seed` with both `DATABASE_URL` and `SEED_PASSWORD` set
2. WHEN the Seed_Script runs, THE Seed_Script SHALL insert or upsert 4 users (`landlord@imizi.rw`, `tenant@imizi.rw`, `admin@imizi.rw`, `agent@imizi.rw`) with deterministic UUIDs
3. WHEN the Seed_Script runs, THE Seed_Script SHALL insert or upsert 5 properties (a house in Kicukiro, an apartment building in Gasabo, a villa in Rubavu, a warehouse in Gasabo, and a land plot in Musanze) with their associated locations, amenities, media, and active listings
4. WHEN the Seed_Script runs for each seeded listing, THE Seed_Script SHALL insert a `background_jobs` row with `name = 'search.index'` and the listing's ID in the payload, unless an equivalent pending or running job already exists
5. WHEN the Seed_Script completes, THE Seed_Script SHALL commit the transaction and print `"Seeded Imizi PostgreSQL database"` to stdout
6. IF `SEED_PASSWORD` is shorter than 16 characters or not set, THEN THE Seed_Script SHALL throw an error before connecting to the database

---

### Requirement 7: Database Smoke Test

**User Story:** As a developer, I want a smoke test to confirm the seeded data is queryable, so that I know the database is in a good state before starting applications.

#### Acceptance Criteria

1. WHEN the database phase concludes, THE Dev_Setup SHALL run `npm run db:smoke` with `DATABASE_URL` set
2. WHEN the Smoke_Script runs, THE Smoke_Script SHALL verify that at least one user, one property, one listing, and one background job of type `search.index` are present in the database
3. IF any expected entity count is zero, THEN THE Smoke_Script SHALL print a descriptive error and exit with a non-zero code

---

### Requirement 8: API Application Startup

**User Story:** As a developer, I want the NestJS API running on port 4000 and responding to health checks, so that the Web application and other clients can reach it.

#### Acceptance Criteria

1. WHEN the applications phase begins, THE Dev_Setup SHALL start the API by running `npm run dev:api` (resolves to `npm run start:dev -w @imizi/api`) as a background process
2. WHEN the API starts, THE API SHALL bind on `0.0.0.0:4000`
3. WHEN the API is running, THE Health_Endpoint SHALL respond to `GET /health` with HTTP 200 and a JSON body containing `status`, `api`, `database`, `redis`, `search`, `storage`, `properties`, and `listings` fields
4. WHEN `database` is `true` in the health response, the Health_Endpoint SHALL reflect that PostgreSQL is reachable from the API process
5. WHEN `redis` is `true` in the health response, the Health_Endpoint SHALL reflect that Redis is reachable from the API process
6. WHEN the API starts, THE JobsService SHALL begin polling `background_jobs` every 5 seconds and processing any `search.index` and `saved-search.match` jobs that are in `PENDING` status

---

### Requirement 9: Web Application Startup

**User Story:** As a developer, I want the Next.js Web application running on port 3000 and loading real data from the API, so that I can interact with the full application locally.

#### Acceptance Criteria

1. WHEN the applications phase continues, THE Dev_Setup SHALL start the Web application by running `npm run dev:web` (resolves to `npm run dev -w @imizi/web`) as a background process
2. WHEN the Web application is running, THE Web SHALL serve the homepage at `http://localhost:3000` with HTTP 200
3. WHEN the Web application renders the homepage, THE Homepage SHALL fetch featured listings from the API via `GET /api/v1/search?listingType=RENT&limit=8` and display the results in the property grid
4. WHEN the API returns an empty result set, THE Homepage SHALL display the "No live listings yet" empty state with a link to `/manage`

---

### Requirement 10: Search Page Filter Completeness

**User Story:** As a property seeker, I want all search filters (listing type, bedrooms, price range, verified-only) to be wired end-to-end so that applying a filter immediately narrows the results returned by the API.

#### Acceptance Criteria

1. WHEN a user selects a listing type chip (`RENT`, `SALE`, or `SHORT_STAY`) on the SearchPage, THE SearchPage SHALL append `listingType=<value>` to the URL query string and re-fetch results
2. WHEN a user adjusts the minimum bedrooms filter in PropertyFilters, THE PropertyFilters SHALL set `bedroomsMin=<n>` in the URL and THE Search_Service SHALL return only listings whose property has `bedrooms >= n`
3. WHEN a user adjusts the maximum price slider in PropertyFilters to a value below 5,000,000 RWF, THE PropertyFilters SHALL set `maxPriceMinor=<value>` in the URL and THE Search_Service SHALL return only listings with `priceMinor <= maxPriceMinor`
4. WHEN a user toggles the Verified-only switch in PropertyFilters, THE PropertyFilters SHALL set `verifiedOnly=true` in the URL and THE Search_Service SHALL return only listings whose property has `verificationStatus = 'VERIFIED'`
5. WHEN a user clears all filters, THE PropertyFilters SHALL remove `bedroomsMin`, `maxPriceMinor`, and `verifiedOnly` from the URL and THE SearchPage SHALL display the full unfiltered result set
6. WHEN the SearchPage is in a loading state, THE SearchPage SHALL render `PropertyCardSkeleton` placeholders in place of real cards
7. IF the search API returns an error, THEN THE SearchPage SHALL display the error message in a notice element without crashing

---

### Requirement 11: Property Detail Page Completeness

**User Story:** As a property seeker, I want the property detail page to display all available property information and present actionable booking CTAs, so that I can make an informed decision and take the next step.

#### Acceptance Criteria

1. WHEN a user visits `/properties/[id]`, THE PropertyDetailPage SHALL fetch the property from `GET /api/v1/properties/:id` and render its title, verification status, property type, location (sector, district, province), bedrooms, bathrooms, parking, and area
2. WHEN the property has associated media, THE PropertyDetailPage SHALL render a `PropertyGallery` component with all media items ordered by `sort_order`
3. WHEN the property has an active listing, THE PropertyDetailPage SHALL display the listing price formatted in RWF in both the aside panel and the sticky bottom bar
4. WHEN the property has an active listing, THE PropertyDetailPage SHALL render the `BookingPanel` component with the listing ID so that the user can initiate a booking, make an offer, or request a viewing
5. WHEN the property description is present, THE PropertyDetailPage SHALL render sanitized HTML description using `isomorphic-dompurify`
6. WHEN the property has valid `latitude` and `longitude` values, THE PropertyDetailPage SHALL render a `PropertyMap` component showing the property location
7. WHEN the property has amenities, THE PropertyDetailPage SHALL render an `AmenityList` component listing all amenity strings
8. IF the API returns an error for a property fetch, THEN THE PropertyDetailPage SHALL display the error message inside a notice element

---

### Requirement 12: Health Endpoint JSON Response

**User Story:** As a developer and operator, I want the `/health` endpoint to return a structured JSON response with connectivity status for every backing service, so that I can quickly diagnose which dependency is unavailable.

#### Acceptance Criteria

1. WHEN a client sends `GET /health`, THE Health_Endpoint SHALL return HTTP 200 with `Content-Type: application/json`
2. WHEN the Health_Endpoint responds, THE Health_Endpoint SHALL include a `database` boolean reflecting live PostgreSQL reachability
3. WHEN the Health_Endpoint responds, THE Health_Endpoint SHALL include a `redis` boolean reflecting live Redis reachability
4. WHEN the Health_Endpoint responds, THE Health_Endpoint SHALL include a `search` boolean reflecting live OpenSearch reachability
5. WHEN the Health_Endpoint responds, THE Health_Endpoint SHALL include a `storage` boolean reflecting live MinIO reachability
6. WHEN the Health_Endpoint responds, THE Health_Endpoint SHALL include `properties` (integer count of published properties) and `listings` (integer count of active listings) fields
7. WHEN the Health_Endpoint responds, THE Health_Endpoint SHALL include a `status` field set to `"ok"` when the API process itself is running
8. WHEN the Health_Endpoint responds, THE Health_Endpoint SHALL include an `engine` field indicating whether search queries are being served by `"opensearch"` or `"postgres-postgis"`

---

### Requirement 13: OpenSearch Index Bootstrap

**User Story:** As a developer, I want all seeded listings indexed into OpenSearch immediately after seeding, so that the search page returns results via the OpenSearch engine rather than falling back to PostgreSQL on first use.

#### Acceptance Criteria

1. WHEN the Seed_Script runs, THE Seed_Script SHALL insert a `search.index` background job for each of the 5 seeded listings using an `INSERT ... WHERE NOT EXISTS` guard to avoid duplicates
2. WHEN the API starts and the JobsService processes a `search.index` job, THE JobsService SHALL index the corresponding listing document into the `imizi-listings` OpenSearch index
3. WHEN the `imizi-listings` index does not exist in OpenSearch, THE JobsService SHALL create the index with an appropriate mapping before indexing the first document
4. WHEN all 5 seed listings have been indexed, THE Search_Service SHALL return results for a `listingType=RENT` query with `engine: "opensearch"` in the response

---

### Requirement 14: Homepage Real-Data Display

**User Story:** As a visitor, I want the homepage to show live inventory and district navigation chips loaded from the API, so that I see actual data rather than empty states.

#### Acceptance Criteria

1. WHEN the Homepage renders, THE Homepage SHALL call `GET /api/v1/search?listingType=RENT&limit=8` and display up to 8 rental property cards in the featured grid
2. WHEN the Homepage renders, THE Homepage SHALL call `GET /api/v1/locations/rwanda?level=DISTRICT` and display up to 18 district chips in the "Search by district" section
3. WHEN a property card is rendered on the Homepage, THE Homepage SHALL display the property title, district, bedroom count, bathroom count, and listing price formatted in RWF
4. WHEN a property has a `media[0].url`, THE Homepage SHALL render an `AppImage` component as the card thumbnail
5. WHEN a property does not have media, THE Homepage SHALL render a `"Media unavailable"` placeholder div in place of the image
6. IF the API call for featured listings fails, THEN THE Homepage SHALL silently catch the error and render the empty state section without crashing the page

