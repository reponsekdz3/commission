# Design Document — Imizi Local Dev Setup & Functionality Improvement

## Overview

This design covers the end-to-end work needed to bring the Imizi monorepo to a fully
functional local development state and to improve several core application features.
The work is grouped into two categories:

1. **Setup & infrastructure** — idempotent shell-level tasks: environment file generation,
   Docker Compose service management, npm workspace installation, database lifecycle
   (migration fix, migrate, seed, smoke), and process startup.
2. **Functional improvements** — targeted TypeScript/TSX code changes to the NestJS API
   and Next.js web app: migration rename, health endpoint enrichment, OpenSearch bootstrap,
   search filter completeness, property detail page enrichment, and homepage real-data
   loading.

All work executes inside the monorepo at `c:\Users\Q.C\Videos\commission\` on Node 24
with npm 11 workspaces. Docker Desktop (29.8.1) is already running.

---

## Architecture

```mermaid
graph TD
  subgraph "Local Machine"
    ENV[".env file\n(workspace root)"]
    API["apps/api\nNestJS 11 · :4000"]
    WEB["apps/web\nNext.js 15 · :3000"]
    PKGS["packages/*\n@imizi/domain, auth, etc."]
  end

  subgraph "Docker Compose"
    PG["PostgreSQL/PostGIS 16\n:5432"]
    RDS["Redis 7\n:6379"]
    OS["OpenSearch 2.17.1\n:9200"]
    MN["MinIO\n:9000/:9001"]
    PROM["Prometheus\n:9090"]
    GRAF["Grafana\n:3001"]
  end

  ENV --> API
  ENV --> WEB
  API --> PG
  API --> RDS
  API --> OS
  API --> MN
  WEB --> API
  PROM --> API
  GRAF --> PROM
  PKGS --> API
  PKGS --> WEB
```

The local dev topology intentionally keeps the API running as a native Node process
(`tsx watch`) so that hot-reload and TypeScript source maps work without container
rebuilds. Only the backing services run in Docker.

---

## Components and Interfaces

### 1. Environment Bootstrap (`scripts/setup-env.ts` or inline shell)

Reads `.env.example`, substitutes concrete values, and writes `.env`.

**Key substitutions:**

| Variable | Dev value |
|---|---|
| `JWT_ACCESS_SECRET` | `crypto.randomBytes(32).toString('hex')` |
| `JWT_REFRESH_SECRET` | `crypto.randomBytes(32).toString('hex')` |
| `MAPS_PROVIDER` | `catalog` |
| `SEED_PASSWORD` | `ImiziDev2024Seed!` (≥16 chars) |
| `DATABASE_URL` | `postgresql://imizi:imizi_dev@localhost:5432/imizi?schema=public` |
| `REDIS_URL` | `redis://localhost:6379` |
| `OPENSEARCH_URL` | `http://localhost:9200` |
| `S3_ENDPOINT` | `http://localhost:9000` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` |

Idempotency rule: if `.env` already exists the script exits without modifying it.

---

### 2. Database Migration Renaming

**Problem:** The Migration_Runner sorts files alphabetically. Two files share the `002_`
prefix, which creates a conflict because:

- `002_production_integrity.sql` — adds `organization_id` (nullable) to `users`,
  `available_from` (nullable) to `property_listings`, and creates `device_push_tokens`,
  `reauth_tokens`, `background_jobs` tables.
- `002_production_persistence.sql` — adds `bedrooms/bathrooms/parking/area_value/area_unit`
  to `properties`, adds `available_from NOT NULL DEFAULT now()` to `property_listings`,
  creates pg_trgm indexes, adds `organization_id UUID` to `users`.

When sorted, `002_production_integrity.sql` runs first and adds `available_from` as
nullable. Then `002_production_persistence.sql` tries to add `available_from NOT NULL
DEFAULT now()` — this succeeds because `ADD COLUMN IF NOT EXISTS` on an already-existing
column is a no-op in PostgreSQL. Similarly `organization_id` is added by both, also
idempotent.

**Fix:** Rename to stable prefixes so ordering is unambiguous regardless of sort locale:

- `002_production_integrity.sql` → `002a_production_integrity.sql`
- `002_production_persistence.sql` → `002b_production_persistence.sql`

This is a simple file rename — no SQL content changes needed because every relevant
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS` clause is already idempotent.

**schema_migrations impact:** The runner records the filename as the version key. A rename
means the old filename is no longer tracked. On fresh databases this is fine. On a database
that has already had the old filenames applied, the renamed files will appear unapplied and
be re-run. Since all DDL uses `IF NOT EXISTS` guards, re-running is safe.

---

### 3. Health Endpoint Enrichment

**Current state:** `HealthController` already returns `database`, `redis`, `search`,
`storage`, `payment`, `properties`, `listings`, and `status` from the `/health` route.

**Gap identified in Requirement 12.8:** The health response does not currently include
an `engine` field that indicates whether search queries use OpenSearch or the PostgreSQL
fallback.

**Solution:** Add an `engine` field derived from `this.deps.searchOk`:

```typescript
// In HealthController.snapshot()
engine: this.deps.searchOk ? "opensearch" : "postgres-postgis"
```

This is a one-line addition to the existing `snapshot()` private method.

---

### 4. OpenSearch Index Bootstrap

**Context:** The Seed_Script already inserts `search.index` background jobs for every
seeded listing (using a `WHERE NOT EXISTS` guard). The JobsService polls every 5 seconds
and processes these jobs automatically once the API starts.

**Requirement 13.3** mandates that the JobsService creates the `imizi-listings` OpenSearch
index if it does not exist before indexing the first document.

**Design:** A defensive `createIndexIfMissing()` call at the start of the
`search.index` job handler in the jobs service:

```typescript
async function ensureIndex(client: OpenSearchClient, indexName: string): Promise<void> {
  const exists = await client.indices.exists({ index: indexName });
  if (!exists.body) {
    await client.indices.create({
      index: indexName,
      body: { mappings: LISTING_INDEX_MAPPING }
    });
  }
}
```

The `LISTING_INDEX_MAPPING` defines field types for `listingId`, `title`, `description`,
`district`, `province`, `sector`, `propertyType`, `listingType`, `priceMinor`, `bedrooms`,
`bathrooms`, `amenities`, `verificationStatus`, `status`, `propertyStatus`, `location`
(geo_point), `updatedAt`, and `createdAt`.

---

### 5. Search Page Filter Completeness

**Current state:** `PropertyFilters` wires `bedroomsMin`, `maxPriceMinor`, and
`verifiedOnly` to URL params and the `useProperties` hook reads the full query string.
The `Search_Service` handles all three params. The listing-type chips at the bottom of the
filter row already set `listingType` in the URL.

**Gaps identified by audit:**

1. The `PropertyFilters` component does not expose a `propertyType` dropdown (e.g., HOUSE,
   APARTMENT, LAND, VILLA). The search API supports `propertyType` but the UI has no
   control for it.
2. The `PropertyFilters` component does not expose a `district` dropdown. The search API
   supports `district` filtering but the UI only sets it via free-text search.

**Additions:**

- Add a `propertyType` select control to `PropertyFilters` that writes
  `propertyType=<value>` to the URL using the existing `apply()` / `router.replace()`
  pattern.
- Add a `district` select control to `PropertyFilters` populated from
  `GET /api/v1/locations/rwanda?level=DISTRICT` (already used by the homepage), writing
  `district=<value>` to the URL.

Both controls follow the same stateful pattern as the existing `beds` and `verified`
controls: local state + URL sync on change.

---

### 6. Property Detail Page Enrichment

**Current state:** The `PropertyDetailPage` already renders gallery, specs grid
(beds/baths/parking/area), description, amenities, map, and booking panel.

**Gaps:**

1. The `BookingPanel` component is imported and rendered but its internal CTA buttons
   (Book / Make Offer / Request Viewing) need to be verified to send correct API calls with
   the listing ID.
2. The `PropertyGallery` component receives the filtered `media` array but does not sort
   by `sort_order` before rendering.
3. There is no `district`/`province`/`sector` type selector for property type label — the
   page currently shows the raw `propertyType` enum value (e.g. `APARTMENT_BUILDING`)
   rather than a human-friendly string.

**Additions:**

- Add a `PROPERTY_TYPE_LABELS` map in `apps/web/lib/format.ts` (create if absent) to
  convert enum values to readable labels (e.g. `APARTMENT_BUILDING → "Apartment Building"`).
- Sort `media` by `sort_order` (ascending) before passing to `PropertyGallery`.
- Verify `BookingPanel` calls `POST /api/v1/bookings`, `POST /api/v1/offers`, and
  `POST /api/v1/viewings` respectively with the correct `listingId`.

---

### 7. Homepage Real-Data Loading

**Current state:** `app/page.tsx` already calls `api("/search?listingType=RENT&limit=8")`
and `api("/locations/rwanda?level=DISTRICT")` with `try/catch` around both.

**Gap:** The `property_media` table stores `storage_key` (the URL or object key), not a
direct CDN URL. The Seed_Script seeds full Unsplash URLs as `storage_key` values. The API
`/properties/:id` endpoint resolves CDN URLs, but the search endpoint may return
`storage_key` directly for the media array.

**Verification required:** Check that the search endpoint's response shape for `media`
includes a resolved `url` field. If it returns only `storage_key`, the homepage card image
would be broken.

**Design decision:** The `AppImage` component in `components/app-image.tsx` wraps
`next/image` with a `src` prop. If `storage_key` is a full URL (as seeded), it renders
correctly. If it is a relative key, a URL resolution step is needed in the API response.

The current seed inserts full Unsplash URLs as `storage_key`, so the homepage will work
without additional changes as long as the search API returns `media[0].url` mapped from
`storage_key`. This mapping should be confirmed in the search endpoint's DB query and
corrected if absent.

---

## Data Models

### `.env` key-value pairs (relevant subset)

```
NODE_ENV=development
DATABASE_URL=postgresql://imizi:imizi_dev@localhost:5432/imizi?schema=public
REDIS_URL=redis://localhost:6379
OPENSEARCH_URL=http://localhost:9200
OPENSEARCH_INDEX=imizi-listings
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=imizi
S3_SECRET_KEY=imizi_secret
MAPS_PROVIDER=catalog
JWT_ACCESS_SECRET=<32+ char random hex>
JWT_REFRESH_SECRET=<32+ char random hex>
SEED_PASSWORD=ImiziDev2024Seed!
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### `schema_migrations` table

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     TEXT PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

The `version` column stores the filename (e.g. `002a_production_integrity.sql`).

### `background_jobs` table (created by `002a_production_integrity.sql`)

```sql
CREATE TABLE IF NOT EXISTS background_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  payload      JSONB NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'PENDING'
               CHECK (status IN ('PENDING','RUNNING','DONE','FAILED')),
  attempts     INTEGER NOT NULL DEFAULT 0,
  run_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at    TIMESTAMPTZ,
  finished_at  TIMESTAMPTZ,
  last_error   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### OpenSearch listing document shape

```json
{
  "listingId": "uuid",
  "id": "property-uuid",
  "title": "string",
  "description": "string",
  "district": "string",
  "province": "string",
  "sector": "string",
  "propertyType": "HOUSE | APARTMENT_BUILDING | VILLA | WAREHOUSE | LAND | ...",
  "listingType": "RENT | SALE | SHORT_STAY",
  "priceMinor": 900000,
  "currency": "RWF",
  "bedrooms": 3,
  "bathrooms": 2,
  "parking": 2,
  "amenities": ["water", "electricity"],
  "verificationStatus": "VERIFIED | UNVERIFIED",
  "status": "ACTIVE",
  "propertyStatus": "PUBLISHED",
  "location": { "lat": -1.978, "lon": 30.112 },
  "availableFrom": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

### Health endpoint response shape

```json
{
  "status": "ok",
  "api": true,
  "database": true,
  "redis": true,
  "search": true,
  "storage": true,
  "payment": false,
  "properties": 5,
  "listings": 5,
  "engine": "opensearch"
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid
executions of a system — essentially, a formal statement about what the system should do.
Properties serve as the bridge between human-readable specifications and
machine-verifiable correctness guarantees.*

### Property 1: Migration Runner Alphabetical Ordering

*For any* list of SQL filenames matching the pattern `/^\d+_.*\.sql$/`,
the Migration_Runner SHALL process them in the same order as JavaScript's
`Array.prototype.sort()` (lexicographic ascending), and every file processed shall be
distinct (no file applied twice in the same run).

**Validates: Requirements 4.1, 5.2**

---

### Property 2: Migration Runner Idempotency

*For any* set of migration files that have already been recorded in `schema_migrations`,
running the Migration_Runner again SHALL leave the `schema_migrations` table unchanged —
no previously-applied version is re-applied and no new rows are inserted for already-applied
versions.

**Validates: Requirements 4.5, 5.2**

---

### Property 3: Seed Idempotency

*For any* number of times the Seed_Script is executed against the same database (given
the same `SEED_PASSWORD`), the count of rows with the four deterministic user UUIDs in
the `users` table SHALL remain exactly 4, and the count of rows with the five deterministic
property UUIDs in the `properties` table SHALL remain exactly 5.

**Validates: Requirements 6.2, 6.3**

---

### Property 4: Search Index Job Deduplication

*For any* number of Seed_Script executions, the count of `background_jobs` rows with
`name = 'search.index'` and `status IN ('PENDING', 'RUNNING')` for any given `listingId`
SHALL never exceed 1.

**Validates: Requirements 6.4, 13.1**

---

### Property 5: Search Bedrooms Filter Invariant

*For any* `bedroomsMin` value `n ≥ 1` and any result set returned by the Search_Service,
every item in the result set SHALL have `property.bedrooms >= n`. No item with
`property.bedrooms < n` (or `null` bedrooms when `n > 0`) shall appear in results.

**Validates: Requirements 10.2**

---

### Property 6: Search Price Filter Invariant

*For any* `maxPriceMinor` value `p > 0` and any result set returned by the Search_Service,
every item in the result set SHALL have `listing.priceMinor <= p`.

**Validates: Requirements 10.3**

---

### Property 7: Search Verified Filter Invariant

*For any* search query where `verifiedOnly = true` and any result set returned by the
Search_Service, every item in the result set SHALL have
`property.verificationStatus === "VERIFIED"`.

**Validates: Requirements 10.4**

---

## Error Handling

| Failure scenario | Component | Behaviour |
|---|---|---|
| `.env` already exists | Dev_Setup | Exit 0, no-op — never overwrite |
| Docker service unhealthy after retries | Dev_Setup | Log failing service name, exit 1 |
| `npm install` fails | Dev_Setup | Log npm error output, halt phases |
| Migration SQL error | Migration_Runner | ROLLBACK, log error, exit 1 |
| Seed SEED_PASSWORD missing / short | Seed_Script | Throw before DB connect, exit 1 |
| Seed transaction error | Seed_Script | ROLLBACK, log error, exit 1 |
| API cannot reach PostgreSQL | HealthController | `database: false` in health JSON |
| API cannot reach Redis | HealthController | `redis: false` in health JSON |
| API cannot reach OpenSearch | HealthController | `search: false`, `engine: "postgres-postgis"` |
| Search page API error | SearchPage | Renders error notice, no crash |
| Property detail API error | PropertyDetailPage | Renders error notice, no crash |
| Homepage API error | Homepage | Silently catches, renders empty state |

---

## Testing Strategy

PBT is appropriate for this feature because it contains pure functions (migration sorting,
search filter logic, seed idempotency) whose correctness properties hold across a wide
input space. The chosen library is **fast-check** (TypeScript), which integrates with
**Jest** or **Vitest**.

### Unit and Example-Based Tests

- `.env` generation: assert JWT secrets are ≥32 chars, `MAPS_PROVIDER=catalog`, `SEED_PASSWORD` is set
- Health endpoint schema: integration test asserting all required JSON keys are present and have correct types
- Property detail page rendering: unit test with mocked API responses verifying gallery sort order and label formatting

### Property-Based Tests (fast-check)

Each property test is tagged with a reference comment in the format:
`// Feature: imizi-local-setup, Property N: <property text>`

| Property | Test approach |
|---|---|
| **Property 1** — Migration ordering | Generate arbitrary lists of SQL filenames; assert sorted output is stable and matches expected lexicographic order |
| **Property 2** — Migration idempotency | Simulate `schema_migrations` with pre-applied entries; assert running again produces no new inserts |
| **Property 3** — Seed idempotency | Run seed twice against a test database; assert user count = 4, property count = 5 |
| **Property 4** — Job deduplication | Run seed N times; assert `COUNT(*) WHERE name='search.index' AND status IN ('PENDING','RUNNING')` per listing never exceeds 1 |
| **Property 5** — Bedrooms filter | Generate random `bedroomsMin` values and mock result sets; assert every result satisfies the constraint |
| **Property 6** — Price filter | Generate random `maxPriceMinor` values and mock result sets; assert every result satisfies the constraint |
| **Property 7** — Verified filter | Generate random result sets with mixed verification statuses; assert all results are VERIFIED when filter is on |

### Integration Tests

- Docker health checks: verify all containers reach healthy state within timeout
- API health endpoint: call `GET /health` and verify response shape
- OpenSearch indexing: after seed + JobsService poll, call search API and assert `engine === "opensearch"`
