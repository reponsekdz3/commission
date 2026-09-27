# Imizi

Imizi is a Rwanda-first real-estate marketplace and property-operations platform implemented in this repository.

**Repository truth:** this README documents behavior that is represented by checked-in code and persistent data models. It deliberately does not describe planned features as working features. External provider credentials and infrastructure are required for provider-backed behavior.

## Stack

- **API:** NestJS + TypeScript, REST under `/api/v1`, authenticated Socket.IO namespace `/realtime`.
- **Web:** Next.js 15 + React 19.
- **Mobile:** Expo 57 + React Native 0.86 + Expo Router.
- **Database:** PostgreSQL + PostGIS, pgcrypto, btree_gist and citext.
- **Search:** PostgreSQL-backed search with OpenSearch indexing/fallback paths.
- **Object storage:** S3-compatible storage using presigned uploads/downloads.
- **Background processing:** PostgreSQL-backed durable job queue.
- **Payments:** MTN MoMo and Flutterwave provider integrations.
- **Notifications:** in-app notifications plus optional Expo Push, email and SMS jobs.
- **Security:** JWT access/refresh sessions, MFA/re-authentication paths, throttling, RBAC/object-level authorization, audit records and upload malware-scanning hooks.

## What is actually functional

### Authentication and accounts

Implemented API flows include:

- registration and login
- access/refresh token sessions and revocation
- MFA configuration/verification paths
- role-based authorization
- property/organization object-level access checks
- profile and privacy operations
- push-token registration and notification preferences
- audit records

The web client uses authenticated API transport with refresh handling. Mobile stores its session credentials with Expo SecureStore.

### Property and listing lifecycle

The backend persists:

- properties and units
- Rwanda location hierarchy and PostGIS coordinates
- amenities and structured property features
- rent, sale and short-stay listings
- prices and availability
- verification/risk state
- favorites and saved searches
- property view analytics

The web inventory studio creates real property/listing records and calls the backend publish flow. It does not generate fake inventory.

### Search and maps

The search API supports filtering by:

- listing type
- property type
- Rwanda administrative location fields
- bedrooms/bathrooms
- price/currency
- amenities
- geographic radius/bounding box
- verification
- availability

Map and nearby endpoints use persisted coordinates. Web and mobile property screens display real coordinates returned by the API.

### Bookings and viewings

Implemented transaction flow includes:

1. listing selection
2. availability/quote calculation
3. persistent booking creation
4. idempotency protection
5. payment-intent creation
6. payment lifecycle/webhook processing
7. booking expiry/activation/completion background jobs
8. viewing-slot discovery and viewing requests

The database has an exclusion constraint to prevent overlapping active bookings for the same unit/listing.

### Offers and payments

Sale listings support:

- buyer offers
- seller accept/reject/counter
- buyer withdrawal
- ownership checks
- persisted payment intents
- provider references/events
- refunds
- platform ledger entries

**Real payment caveat:** MTN MoMo and Flutterwave calls only become live transactions after their production credentials, callback/webhook configuration and provider-side account setup are supplied.

### Messaging and realtime

Messaging is persisted in PostgreSQL and is available from web and mobile.

Implemented:

- conversation creation linked to property/booking/offer context
- membership authorization
- message history
- send/read state
- authenticated Socket.IO connections
- conversation-room authorization
- typing events
- realtime message delivery
- push/in-app notification hooks for new messages

#### Message attachments

Messages now support a real private object-storage attachment pipeline:

1. authenticated client requests a presigned upload URL
2. file uploads directly to S3-compatible storage
3. API verifies the uploaded object and records metadata
4. attachment IDs are bound to the persisted message
5. authorized conversation members receive short-lived download URLs

Allowed attachment types are restricted to common images, video, audio, PDF and plain text. The API limits message attachments to **50 MB per file** and up to **10 attachments per message**.

The storage path is private; attachments are not exposed as permanent public URLs.

The current repository does **not** claim end-to-end encrypted messaging or native voice/video calling.

### Property media uploads

Property owners/managers can upload:

- JPEG/PNG/WebP photos
- MP4 video walkthroughs
- 360 panorama images
- floor-plan media at the database/application level

The upload flow uses presigned S3-compatible PUT requests. The API records completed media and queues background processing.

For photos, the worker can create WebP size variants and posters.

For MP4 video, the worker can create a 720p H.264/AAC optimized copy and a poster frame.

Uploaded media is passed through the configured malware-scanning hook before processing. ClamAV is optional at configuration level; deployments that require mandatory antivirus scanning must provide it.

### Property walkthroughs and 360 viewing

The repository supports two different immersive media concepts and does not conflate them:

**Walkthrough video**
- Real uploaded MP4 video is rendered with native browser/mobile video controls.
- The backend processes an optimized video variant when ImageMagick/FFmpeg are available in the worker environment.

**360 panorama tour**
- A listing can contain multiple `TOUR_360` scenes.
- The web client uses a WebGL renderer that maps the uploaded equirectangular panorama onto an inside-facing sphere.
- Users can drag to look around, change pitch/yaw, zoom the camera field of view and enter fullscreen.
- Multiple uploaded rooms/scenes can be selected without inventing imagery.
- Mobile provides an interactive panorama scene viewer with swipe navigation.

**Important limitation:** this is a real 360/equirectangular panorama viewer, not a photogrammetry reconstruction, LiDAR mesh, Matterport-compatible scan or full WebXR VR system. A true 3D room mesh requires compatible 3D assets and an additional model-processing/rendering pipeline that is not claimed here.

### Documents and verification

Private property documents support:

- presigned private uploads
- metadata persistence
- expiry dates
- authorized downloads
- verification decisions by authorized verification roles

### Property operations

The backend contains implemented flows for:

- rental agreements/leases
- maintenance requests
- notifications
- analytics
- agencies and organization membership
- moderation/reporting
- verification queues
- privacy export/account deletion scheduling
- recommendations based on persisted interaction data

## Web application

The web application contains routes for:

- home/discovery
- search
- map
- property detail
- compare
- favorites
- messaging
- bookings
- offers
- notifications
- leases
- maintenance
- dashboard/workspace
- inventory management
- administration
- legal/privacy

The property detail page consumes API-returned property data, media, listings, location and transaction information. It renders uploaded walkthrough videos and `TOUR_360` scenes when those assets exist.

The inventory page contains the property/listing creation flow and direct property-media upload UI.

The messages page supports authenticated conversation history, sending and private attachment upload/download.

## Mobile application

The Expo application contains:

- authentication/session persistence
- property discovery/search
- property details
- maps
- favorites/dashboard/notifications
- booking quote/booking/payment initiation
- viewing requests
- offers
- realtime-oriented messaging
- private message attachments
- uploaded property video playback
- interactive 360 panorama scenes
- push notification registration

Mobile file attachments use the device document picker and the same authenticated private-storage API used by web.

## Media and storage requirements

For media functionality, production infrastructure needs:

- S3-compatible object storage
- public/private buckets configured correctly
- S3 CORS permitting the browser/mobile upload origin
- optional CDN with correct CORS/cache behavior
- FFmpeg and ImageMagick available to the media worker if media optimization is required
- ClamAV if mandatory malware scanning is required

The storage service signs object URLs rather than sending large files through the API process.

## Required production infrastructure

The application is not a hosted service merely because the source code exists. A real deployment needs:

- PostgreSQL/PostGIS
- Redis where enabled by deployment configuration
- OpenSearch where enabled
- S3-compatible object storage
- CDN if desired
- DNS/TLS
- secret management
- database backups and restore testing
- monitoring/log aggregation
- provider credentials for payments
- map provider credentials
- Expo/EAS credentials for mobile distribution
- email/SMS provider configuration if those channels are required

Provider credentials must not be committed to Git.

## Environment variables

The API configuration reads values including:

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
- `MTN_MOMO_CALLBACK_SECRET`
- payment-provider credentials used by the provider integrations
- notification/email/SMS credentials used by the worker

Production JWT secrets must be at least 32 characters.

## Database migrations

The SQL migration set includes the base schema plus production integrity/persistence/workflow/hardening migrations and the messaging/media attachment migration.

Run:

```bash
npm run db:migrate
npm run db:seed
npm run db:smoke
```

## Development

Requirements:

- Node.js 20.18+
- npm 11+
- Docker for the local infrastructure used by CI/development

Install:

```bash
npm install
```

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

Checks:

```bash
npm run typecheck
npm test
npm run build
npm run mobile:typecheck
npm run mobile:doctor
npm run db:smoke
```

## CI and verification boundary

GitHub Actions checks API typechecking/tests/build, database migration/seed/smoke behavior, API health/readiness/search/auth smoke paths, web typechecking/build, mobile TypeScript/Expo configuration and dependency security.

CodeQL and Dependabot configuration are also checked in.

CI is evidence about the checked-in code at a particular commit; it is not evidence that external payment accounts, S3 buckets, DNS, mobile certificates or production secrets have been configured.

Before a public launch, run a staging end-to-end test covering:

- real account registration/login
- real property media upload
- real 360 panorama upload
- real walkthrough video playback
- message attachment upload/download between two accounts
- booking and payment callback
- notification delivery
- backup/restore
- mobile Android/iOS builds

## Deliberate non-claims

The repository does **not** currently claim:

- end-to-end encrypted chat
- native voice/video calling
- photogrammetry/LiDAR 3D reconstruction
- WebXR/VR support
- automatic property scanning from a phone camera
- fake/demo inventory as real marketplace inventory
- live payment processing without configured provider accounts
- live maps without a configured map provider token

Those are separate engineering projects and should only be added to this README after their complete backend, client and infrastructure paths are implemented and tested.

## Repository truth rule

If a feature is not backed by an API, persistent model, real client wiring, background processing where required, or an explicitly configured external provider, it should not be described as fully functional here.


## Rwanda administrative location integrity

Property creation for Rwanda uses a canonical administrative hierarchy stored in PostgreSQL and exposed by the public location API:

**Province → District → Sector → Cell → Village (optional at listing time).**

The database seed synchronizes Rwanda administrative boundary data from the Rwanda government GIS service using NISR 2022 boundary data, including the full national hierarchy rather than a hand-written shortlist. New Rwanda properties must select canonical Province, District, Sector and Cell IDs; the API verifies every parent-child relationship before inserting the property. Names are resolved from canonical records instead of trusting client-supplied labels. Village is also available when the exact village is known.

This prevents invalid combinations such as a sector belonging to one district being submitted under another district, and makes the same hierarchy available to web and mobile clients through the locations API.
