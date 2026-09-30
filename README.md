<div align='center'>

# IMIZI

### Rwanda Real-Estate Marketplace & Property Operations Platform

**Discover. Locate. Compare. Message. View. Book. Pay. Manage.**

<p>
  <a href='https://github.com/reponsekdz3/commission/actions/workflows/ci.yml'><img src='https://github.com/reponsekdz3/commission/actions/workflows/ci.yml/badge.svg' alt='CI'></a>
  <a href='https://github.com/reponsekdz3/commission/actions/workflows/codeql.yml'><img src='https://github.com/reponsekdz3/commission/actions/workflows/codeql.yml/badge.svg' alt='CodeQL'></a>
  <img src='https://img.shields.io/badge/Next.js-15-black?logo=next.js' alt='Next.js 15'>
  <img src='https://img.shields.io/badge/Expo-57-000020?logo=expo' alt='Expo 57'>
  <img src='https://img.shields.io/badge/PostgreSQL-PostGIS-336791?logo=postgresql' alt='PostgreSQL PostGIS'>
  <img src='https://img.shields.io/badge/API-NestJS-E0234E?logo=nestjs' alt='NestJS'>
</p>

<p><img src='docs/assets/imizi-hero.svg' alt='Imizi product overview' width='100%'></p>

## App showcase — Web + Mobile

<p><img src='docs/assets/imizi-app-showcase.svg' alt='Imizi web and mobile app showcase' width='100%'></p>

> Repository-native product showcase based on the current UI surfaces. It is a product visual, not a production screenshot.

<p><strong>A connected web + mobile property platform built around real property records, canonical Rwanda locations, geospatial discovery, transactions, messaging, media and property operations.</strong></p>

</div>

---

## Product truth at a glance

| Capability | Backend | Web | Mobile | Persistent data | External setup |
|---|:---:|:---:|:---:|:---:|---|
| Authentication + sessions | ✅ | ✅ | ✅ | ✅ | deployment secrets |
| Rwanda Province → Village hierarchy | ✅ | ✅ | ✅ | ✅ | location seed/sync |
| Property / unit / listing model | ✅ | ✅ | ✅ | ✅ | — |
| Search + filters | ✅ | ✅ | ✅ | ✅ | — |
| PostGIS geographic search | ✅ | ✅ | ✅ | ✅ | PostGIS |
| OpenSearch + PostgreSQL fallback | ✅ | ✅ | ✅ | ✅ | OpenSearch when enabled |
| Maps + geographic discovery | ✅ | ✅ | ✅ | ✅ | map credentials where required |
| Favorites + saved searches | ✅ | ✅ | ✅ | ✅ | authenticated user |
| Compare | ✅ | ✅ | ✅ | ✅ | — |
| Photos / video / 360 media | ✅ | ✅ | ✅ | ✅ | S3-compatible storage |
| Viewing + booking lifecycle | ✅ | ✅ | ✅ | ✅ | payment config for paid flows |
| Offers | ✅ | ✅ | ✅ | ✅ | — |
| Payments + webhooks + ledger | ✅ | ✅ | ✅ | ✅ | MTN MoMo / Flutterwave setup |
| Realtime messaging | ✅ | ✅ | ✅ | ✅ | websocket deployment |
| Private message attachments | ✅ | ✅ | ✅ | ✅ | object storage |
| Notifications | ✅ | ✅ | ✅ | ✅ | push/email/SMS providers for delivery |
| Leases + maintenance | ✅ | ✅ | ✅ | ✅ | — |
| Verification + moderation + audit | ✅ | ✅ | ✅ | ✅ | authorized operations users |

**Legend:** ✅ means the capability has checked-in client/API/domain/persistence wiring. External setup is separated from implementation so the README never confuses integration code with live provider configuration.

## Connected product journey

<p><img src='docs/assets/imizi-platform-journey.svg' alt='Imizi connected product journey' width='100%'></p>

**One property context follows the customer from discovery through transaction and ongoing operations.**

### Customer journey

**Discover → Search → Locate → Compare → Save → Message → View → Book → Pay → Manage**

### Owner journey

**Create property → Choose Rwanda location → Add media → Publish → Receive leads → Handle viewings/bookings → Manage payments → Run operations**

## Product experience promises

- **Real data first:** marketplace cards, maps, saved items, bookings, messages and management screens use the existing backend/data layer rather than demo-only state.
- **Rwanda native:** canonical Province → District → Sector → Cell → Village location records are shared across clients.
- **Transaction aware:** property context is preserved as users move from discovery into viewing, booking, payment and operations.
- **Media rich:** image, video and 360 content are represented through the actual property-media pipeline.
- **Interactive:** map/list search, save, compare, share, bottom sheets, haptics, realtime messaging and responsive workspace actions are part of the product surface.
- **Honest boundaries:** provider credentials, device validation and production infrastructure are explicitly documented instead of being presented as already verified.

## Visual product documentation

These visuals are generated from repository product concepts, not fabricated customer screenshots. Real screenshots should only be added after capture from the running web/mobile builds.

## What was upgraded in the latest UI pass

- Web marketplace hero and richer discovery entry points
- District discovery rail tied to the location API
- Property cards with real save / compare / share interactions
- Verification, media-count and location cues
- Responsive navigation and marketplace shell polish
- Mobile quick actions for map, saved properties, bookings and property listing
- Mobile live-backend status, improved empty states and haptic interaction
- Dark/light and reduced-motion foundations preserved

---
## Product surface

Imizi connects the property journey in one account:

**Discover → Search → Map → Compare → Save → Message → View → Book → Pay → Manage**

### Customer experience

The web and mobile clients provide:

- Rent, Buy/Sale, and Short-stay discovery
- Property search with structured filters
- Rwanda location-aware search
- Map-based property discovery
- Radius/bounds search and polygon/drawn-area search foundations
- Saved properties and saved searches
- Property comparison
- Rich property detail pages
- Gallery/media presentation
- Video walkthrough playback
- 360 panorama viewing
- Verification/status indicators
- Viewing and booking flows
- Offers for sale listings
- Payments and payment-intent flows
- Realtime messaging
- Private message attachments
- Notifications
- Customer/account/security settings
- Owner/landlord portfolio operations
- Listings and property management
- Booking, lease and maintenance surfaces
- Administrative/moderation/verification surfaces for authorized roles

### Web UI

The Next.js application is organized around a responsive marketplace shell with:

- sticky glass navigation
- icon-assisted discovery/navigation
- rich search hero
- quick-action command cards
- district discovery rail
- responsive property cards
- save / compare / share actions
- media counts and verification cues
- map/list split search experience
- animated/revealed content where appropriate
- dark/light theme support
- command palette and keyboard-oriented navigation
- notification and account menus
- responsive mobile navigation
- dashboard analytics and workspace views
- accessible focus states and reduced-motion handling

### Mobile UI

The Expo application uses a native-first interaction model with:

- blurred interactive tab bar
- haptic feedback for important interactions
- live search and marketplace home
- quick entry points for map, saved properties, bookings and listing creation
- native map and marker interactions
- map/list bottom-sheet search
- drawn search areas
- saved searches
- property detail and media
- booking/payment screens
- conversations and notifications
- owner/management screens
- theme switching
- secure session persistence

## Architecture

The repository is a modular monolith with shared packages.

| Layer | Technology |
| --- | --- |
| Web | Next.js 15, React 19, TypeScript |
| Mobile | Expo 57, React Native 0.86, Expo Router |
| API | NestJS + TypeScript |
| Database | PostgreSQL + PostGIS |
| Search | PostgreSQL search with OpenSearch integration/fallback |
| Realtime | Socket.IO |
| Cache/infra | Redis where enabled |
| Object storage | S3-compatible storage / MinIO |
| Payments | MTN MoMo + Flutterwave integrations |
| Maps | Map provider abstraction; Mapbox on web where configured |
| Background work | PostgreSQL-backed durable jobs / workers |
| Observability | Prometheus/Grafana foundations and application telemetry |
| CI | GitHub Actions |

The production architecture intentionally keeps the domain logic in one deployable backend while using clear module boundaries for auth, property, listing, search, maps, booking, payments, messaging, notifications, verification, analytics and administration.

## Domain foundations

Important domain separations already represented in the repository include:

- **Property** — the underlying real-world asset.
- **Unit** — a rentable/sellable unit of a property where applicable.
- **Listing** — the commercial offer for rent, sale or short stay.
- **Media** — photos, video, 360 scenes and other property assets.
- **Location** — canonical Rwanda administrative hierarchy plus coordinates.
- **Booking** — persistent transaction state for a unit/listing.
- **Offer** — buyer/seller negotiation state for sale flows.
- **Payment intent / event / ledger** — transaction and accounting records.
- **Conversation / message / attachment** — persistent communications.
- **Verification / risk / audit** — trust and administrative controls.
- **Lease / maintenance / notifications / analytics** — ongoing property operations.

## Rwanda localization

Property creation and search use canonical Rwanda administrative records:

**Province → District → Sector → Cell → Village**

The database stores the hierarchy rather than trusting client-entered labels. Parent/child integrity is checked when a property is written.

The location APIs are shared by the web and mobile clients so the same canonical records can be used for forms, filtering and map-oriented discovery.

## Search and maps

The search layer supports the main marketplace dimensions:

- listing type
- property type
- district/sector and Rwanda location fields
- bedroom/bathroom counts
- price
- amenities
- verification
- availability
- geographic bounds/radius
- polygon/drawn search areas where supported by the client

The search service is resilient to an unavailable or empty OpenSearch result set by retaining PostgreSQL/PostGIS fallback behavior. Returned property media is hydrated from persisted media records.

## Transactions

### Booking flow

The repository models a persistent booking lifecycle around:

**PENDING → PAYMENT_PENDING → CONFIRMED → ACTIVE → COMPLETED**

with expiry/activation/completion jobs and idempotency protections.

The database also protects against overlapping active bookings for the same constrained unit/listing combination.

### Payments

The payment layer contains provider abstractions and persistence for:

- payment intents
- provider references
- provider events
- confirmation/webhooks
- refunds
- ledger entries

> Live payment processing still requires real provider credentials, merchant configuration, secure callback/webhook configuration and staging/production verification.

## Messaging

Messaging is persisted and available from the web/mobile surfaces.

Implemented foundations include:

- property/booking/offer conversation context
- membership authorization
- message history
- read state
- authenticated Socket.IO connections
- authorized conversation rooms
- typing/realtime events
- notification hooks
- private attachments through S3-compatible storage

The repository does **not** currently claim end-to-end encrypted chat or native voice/video calling.

## Media

Property media is designed around direct object-storage uploads instead of routing large files through the API process.

Supported concepts include:

- photos
- MP4 walkthrough videos
- 360 equirectangular panoramas
- floor-plan media at the persistence/application level
- private message attachments

Photo/video processing can create optimized variants/posters when the required worker tools are installed.

### 360 viewer boundary

The immersive feature is a genuine 360/equirectangular panorama viewer.

It is **not** a claim of:

- photogrammetry
- LiDAR room reconstruction
- Matterport-compatible scans
- arbitrary 3D mesh generation
- WebXR VR
- automatic phone-camera room reconstruction

Those require additional capture and rendering pipelines.

## Authentication and authorization

The backend includes foundations for:

- registration/login
- access/refresh sessions
- revocation
- MFA/re-authentication paths
- role-based access control
- object-level authorization
- audit records
- privacy/account operations
- push-token registration

Supported domain roles include administrative, verification, finance, agency, agent, property management, landlord/seller and customer-facing roles.

## Web routes and surfaces

The web application includes the major marketplace and operations surfaces for:

- home/discovery
- search
- map
- property detail
- compare
- favorites
- saved searches
- messages
- bookings
- offers
- payments
- notifications
- leases
- maintenance
- dashboard/workspace
- inventory management
- administration
- legal/privacy

Existing route structure is preserved; UI improvements are layered onto the existing foundations rather than replacing the application's domain navigation.

## Mobile routes and surfaces

The Expo application includes screens for:

- authentication
- tabs/home/search/saved/messages/profile
- map
- property details
- add property
- listings
- dashboard
- bookings
- payment
- offers
- leases
- maintenance
- notifications
- saved searches
- admin/operations
- chat and private attachments
- settings/security/account

## Local development

### Requirements

- Node.js **20.18+**
- npm **11+**
- Docker Desktop with virtualization enabled
- Git
- Android Studio for Android native builds
- Xcode for iOS builds on macOS

### Install

```bash
npm install
```

### Start local infrastructure

The Compose stack provides Postgres/PostGIS, Redis, OpenSearch, MinIO, migration support, API and web foundations.

```bash
docker compose up -d --build
```

Database migrations are executed by the Compose migration service before the API starts.

For explicit seed data:

```bash
docker compose --profile seed up
```

### Run clients separately

API:

```bash
npm run dev:api
```

Web:

```bash
npm run dev:web
```

Mobile:

```bash
npm --prefix apps/mobile start
```

Useful checks:

```bash
npm run typecheck
npm test
npm run build
npm run mobile:typecheck
npm run mobile:doctor
npm run db:smoke
```

## Important local endpoints

When using the included Compose defaults:

| Service | Address |
| --- | --- |
| Web | http://localhost:3000 |
| API | http://localhost:4000 |
| MinIO API | http://localhost:9000 |
| MinIO console | http://localhost:9001 |
| OpenSearch | http://localhost:9200 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |

These values are development defaults, not production secrets.

## Environment configuration

Provider and infrastructure configuration is environment-driven.

Typical API variables include:

- `DATABASE_URL`
- `REDIS_URL`
- `OPENSEARCH_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET_PUBLIC`
- `S3_BUCKET_PRIVATE`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `CDN_BASE_URL`
- `MAX_MEDIA_BYTES`
- `CLAMAV_URL`
- payment provider credentials/callback secrets
- email/SMS provider credentials
- map provider credentials

Production secrets must never be committed to Git.

## CI and release verification

GitHub Actions configuration covers the checked-in code quality and build surface, including API build/test work, database-related verification, web validation, mobile TypeScript/Expo checks and dependency/security checks where configured.

The repository also contains production hardening around:

- reliable migrations in Compose
- reliable MinIO bucket initialization
- API health checking
- web health checking
- strict CI test failures
- PostGIS-capable CI test database
- resilient search fallback
- persisted media hydration on search results

A green CI run proves the checked-in code passed that workflow. It does not prove that external payment accounts, DNS, TLS, maps, push certificates, S3/CDN, SMS/email providers or production infrastructure are configured correctly.

## Production launch checklist

Before public launch, verify in a staging environment:

- real account registration/login
- access/refresh rotation and revocation
- Rwanda location creation at every supported level
- property/listing creation and publishing
- real media upload/download
- image transformation and video processing
- 360 panorama upload and viewing
- map provider configuration
- search fallback and map filtering
- two-account messaging
- message attachment upload/download
- booking lifecycle
- real payment provider sandbox transactions
- webhook signature/idempotency handling
- refunds
- notifications
- backups and restore drills
- Android build/install
- iOS build/install
- browser E2E tests
- load tests against staging
- monitoring/alerting
- privacy/legal review

## Current quality boundary

The codebase should not be described as “production verified” simply because it builds.

The correct distinction is:

**Implemented in code**  
A feature has client, API/domain and persistence foundations checked into the repository.

**Provider-ready**  
The integration exists but requires external credentials/configuration.

**Environment-verified**  
The feature has been executed against a real configured environment and validated there.

**Production-verified**  
The complete release has passed deployment, security, functional, backup/restore, device/browser and operational checks in the target production-like environment.

This README intentionally uses the first two categories unless stronger evidence exists.

## Recent hardening and UI work

The recent repository work strengthened both reliability and user experience without removing the existing application structure.

### Backend/platform hardening

- search fallback no longer treats an empty OpenSearch response as proof that the marketplace is empty
- search result media is hydrated from persisted property media
- CI uses PostGIS for database-backed tests
- CI no longer masks test failures
- Compose performs database migration before API startup
- MinIO bucket initialization is idempotent
- web production container is included in the Compose environment
- API and web healthchecks are present

### Web/mobile experience

- richer marketplace home/search presentation
- responsive navigation and iconography
- property save/compare/share interactions
- media-count and verification cues
- district discovery
- map/list interaction foundations
- native mobile haptics
- mobile quick actions for common property journeys
- accessible/reduced-motion foundations
- dark/light appearance support

## License

See the repository license and legal documentation for the current distribution terms.
