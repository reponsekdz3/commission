# Imizi

Imizi is a Rwanda-first real-estate application in this repository. It contains a NestJS API, a Next.js web client, and an Expo/React Native mobile client.

This document describes what is implemented in code. It is intentionally not a marketing feature list.

## Current architecture

- **API:** NestJS + TypeScript, REST under `/api/v1`, Socket.IO realtime namespace for authenticated messaging.
- **Web:** Next.js 15 + React 19.
- **Mobile:** Expo 57 + React Native 0.86 + Expo Router.
- **Database:** PostgreSQL with PostGIS, pgcrypto, btree_gist and citext.
- **Storage:** S3-compatible object storage with presigned PUT/GET support.
- **Search:** PostgreSQL search plus OpenSearch integration/fallback in the API.
- **Payments:** MTN MoMo and Flutterwave provider integrations, webhook handling, refunds and a double-entry-style platform ledger.
- **Background work:** durable PostgreSQL `background_jobs` queue and worker service.
- **Observability:** health endpoints, Prometheus metrics, OpenTelemetry/Sentry hooks and request IDs.
- **Security:** JWT access/refresh sessions, MFA/re-authentication paths, RBAC/object-level authorization, throttling, audit logs and media malware scanning hooks.

## Functional areas implemented

### Accounts and security

- Registration/login and refresh-token rotation.
- Server-side sessions with revocation.
- Role-based access for owners, agents, agencies, managers and administrators.
- MFA configuration and re-authentication for protected actions.
- Object-level property access checks.
- Push-token registration and notification preferences.
- Privacy/consent and audit records.

### Properties and listings

- Persistent property records, locations and PostGIS coordinates.
- Property units, amenities and listing records.
- Rent, sale and short-stay listing types.
- RWF-native money handling with configurable currencies.
- Publication and verification states.
- Risk/fraud records and moderation workflows.
- Favorites and saved searches.
- Property view analytics.

### Search and maps

- Backend-filtered search by transaction type, property type, Rwanda location fields, bedrooms, bathrooms, price, amenities, verification and coordinates/radius.
- Map/nearby APIs backed by geographic coordinates.
- Search indexing jobs and an OpenSearch integration/fallback path.

### Bookings and viewings

- Booking quotes and persistent bookings.
- Database exclusion constraint prevents overlapping active bookings for the same unit/listing.
- Idempotency keys are stored for booking/payment operations.
- Viewing slots and viewing requests.
- Booking lifecycle workers for activation/completion.
- Rental agreement records generated as part of successful payment workflows.

### Offers and transactions

- Offers for sale listings.
- Offer state machine.
- Payment intents, provider references, payment events and refunds.
- MTN MoMo and Flutterwave integrations are provider-backed; real transactions require valid provider configuration.
- Platform commission and ledger entries are persisted.
- Payment webhooks are processed by the API.

### Messaging

- Persistent conversations linked to properties, bookings or offers.
- Authenticated conversation membership checks.
- REST endpoints for conversation lists, threads, sending and marking conversations read.
- Authenticated Socket.IO connections.
- Conversation room authorization.
- Realtime message delivery and typing events.

The current message data model stores message text and transaction context. It does **not** claim end-to-end encryption or native voice/video calling.

### Media and uploads

- Property photo/video uploads use S3-compatible presigned PUT URLs.
- Upload completion is persisted in PostgreSQL.
- Media processing is queued for background processing.
- Supported property media includes photos, MP4 video, 360-degree panorama images and floor plans at the application level.
- Private document storage uses a separate private bucket path.
- File size limits, MIME allow-listing and optional ClamAV scanning hooks are present.

### Immersive property viewing

The web and mobile clients now expose an **immersive 360° panorama viewer** for property media whose database kind is `TOUR_360`.

Implemented behavior:
- Drag/swipe to look around.
- Zoom controls on web.
- Multiple uploaded panorama scenes can be selected as rooms/views.
- Scene changes reset the view.
- The viewer uses real uploaded property media returned by the API.

Important accuracy note: this is a **360° panorama tour**, not a photogrammetry-generated 3D model or a full WebXR/VR engine. A listing only gets an immersive tour when real `TOUR_360` media has been uploaded. The repository does not fabricate panorama content.

## Web application

Implemented routes include discovery/search, maps, property details, favorites, messages, bookings, offers, notifications, leases, maintenance, inventory management, dashboard/workspace, administration and legal/privacy pages.

The property page reads its listing, media, location and transaction information from the API. Inventory management creates real property/listing records and can upload property media to configured storage.

## Mobile application

The Expo client includes:
- Authentication/session persistence with SecureStore.
- Property discovery/search.
- Property details.
- Maps.
- Favorites/dashboard/notifications.
- Booking, quote, payment initiation and viewing flows.
- Messaging.
- Offline/session-oriented API handling and refresh-token rotation.
- Mobile immersive 360° property viewing for uploaded `TOUR_360` media.

## What is not automatically live

A source-code implementation is not the same as a deployed production service. The following must be configured for corresponding production functionality:

- PostgreSQL/PostGIS
- Redis/OpenSearch where enabled
- S3-compatible storage and CDN
- Mapbox/Google Maps credentials as configured
- MTN MoMo production credentials and callback configuration
- Flutterwave production credentials/webhook hash
- Expo/EAS project credentials for push/build workflows
- Email/SMS providers
- Sentry/OpenTelemetry/Prometheus infrastructure
- ClamAV if mandatory malware scanning is desired

The checked-in `.env.example` contains placeholders and local-development values. Secrets should not be committed.

## Local development

Requirements:
- Node.js 20.18+
- npm 11+
- Docker for the included infrastructure services

Install dependencies:

```bash
npm install
```

Run database migrations:

```bash
npm run db:migrate
```

Run the API:

```bash
npm run dev:api
```

Run the web client:

```bash
npm run dev:web
```

Run mobile:

```bash
npm --prefix apps/mobile start
```

Useful checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run mobile:typecheck
npm run mobile:doctor
npm run db:smoke
```

## Production-readiness boundary

The repository includes production-oriented application architecture and CI checks, but deployment readiness still depends on infrastructure configuration, provider credentials, DNS/TLS, object-storage policy, database backups, monitoring, secret management and a real end-to-end staging test.

Do not interpret an empty database, missing provider credentials or a disabled optional integration as a working live marketplace. The UI is designed to show backend results and empty states rather than inventing inventory.

## CI

GitHub Actions is configured for dependency/security checks, linting, typechecking, tests and builds. CodeQL and Dependabot configuration are also checked in.

## Repository truth rule

When a feature is not backed by an API, persistent data model, real client wiring or an explicitly documented external provider, it should not be described here as fully functional. This README should be updated whenever implementation changes materially.
