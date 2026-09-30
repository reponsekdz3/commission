# Imizi Web

Next.js 15 / React 19 web client for the Imizi Rwanda property marketplace.

## UI architecture

The web app is built around a reusable marketplace shell and existing API/domain contracts.

Core experience areas:

- discovery home
- live search
- map
- property details
- compare
- favorites
- saved searches
- messages
- bookings
- offers
- payments
- notifications
- owner dashboard
- inventory management
- administration
- legal/privacy

## Interaction foundations

The current web client includes:

- Tailwind CSS v4
- Radix primitives
- Framer Motion
- React Query
- React Hook Form + Zod
- Recharts
- Mapbox/react-map-gl foundations
- Next Themes
- command palette
- toast/notification UI
- responsive/mobile navigation
- view-transition foundations
- skeleton/empty/error states
- reduced-motion support
- print support for property details

## Marketplace-specific interactions

Property cards are connected to real account/API operations:

- save/unsave
- compare
- share/copy link
- media count
- verification state
- location context

Search is designed as a map/list experience where selection and map movement stay synchronized with the existing search API.

## Run

From the repository root:

```bash
npm run dev:web
```

Or from `apps/web`:

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Typecheck:

```bash
npm run typecheck
```

## Environment

The web client expects the API URL through the project's environment configuration.

Map rendering requires a configured provider token for provider-backed maps.

Do not commit production secrets.

## Production build boundary

The web container can be built by the repository's Compose setup and served through Next.js production mode.

A successful build does not, by itself, verify:

- real map provider credentials
- real S3/CDN media delivery
- real authentication cookies/tokens in the deployed environment
- payment provider redirects/callbacks
- browser accessibility across the final target matrix
