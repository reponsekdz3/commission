# Imizi production setup

## Runtime architecture
The API is a NestJS modular monolith. PostgreSQL/PostGIS is the transactional source of truth. Redis is used for cache and background-work coordination. OpenSearch is a read/search index with PostgreSQL/PostGIS fallback. S3-compatible object storage handles media. WebSockets handle realtime messaging.

## Local development
1. Copy `.env.example` to `.env` and replace secrets.
2. Start infrastructure: `docker compose up -d postgres redis opensearch minio minio-init`
3. Run database migrations: `npm run db:migrate`
4. Seed Rwanda demo inventory: `npm run db:seed`
5. Verify the database: `npm run db:smoke`
6. Start the API: `npm run dev:api`
7. Start the web app: `npm run dev:web`

The development stack creates public/private MinIO buckets and applies browser CORS to them.

## Production database
Run migrations once per release/deployment target: `npm run db:migrate`.
Do not run the development seed against a production database.
Back up PostgreSQL before migrations and keep point-in-time recovery enabled.

## Payments
MTN MoMo is the Rwanda collection adapter. Set the real subscription key, API user, API key, target environment and public HTTPS callback URL. Request-to-pay is asynchronous: the app should keep the booking in `PAYMENT_PENDING` until the verified provider callback or server-side status reconciliation confirms success.
Do not treat a client-side payment-success message as authoritative.

## Media
Configure S3-compatible endpoint, access key, secret key, public/private buckets and optional CDN base URL. The API returns short-lived presigned PUT URLs. Sensitive documents must use the private bucket and should not be served as public CDN URLs.

## Maps
Set `MAPS_PROVIDER=mapbox` and `MAPBOX_TOKEN` for live geocoding, reverse geocoding, POI search and routing. Without the token, the API uses a Rwanda catalog fallback so development and tests do not depend on third-party credentials.

## Search
OpenSearch is populated asynchronously through `background_jobs`. If OpenSearch is unavailable, search falls back to PostgreSQL/PostGIS. When OpenSearch returns, queued indexing jobs can rebuild the search view.

## Security
Use unique production JWT secrets of at least 32 characters, HTTPS, a real secret manager, restricted CORS origins, database TLS where required, MFA for privileged accounts, verified payment webhooks and separate credentials per environment.

## Operational endpoints
- `/health`
- `/ready`
- `/live`
- `/metrics`
- `/docs`

## CI
GitHub Actions runs npm install, database migrations, database seed, the PostGIS/database smoke check, domain tests, API tests, typecheck, and domain/API/web builds.
A deployment should only proceed from a successful CI build and a separately reviewed production configuration.
