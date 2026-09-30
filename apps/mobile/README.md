# Imizi Mobile

Native mobile client for the Imizi Rwanda real-estate marketplace.

## What it covers

The app is built with Expo 57, React Native 0.86 and Expo Router.

Current mobile surfaces include:

- authenticated account/session persistence
- discovery and live search
- Rwanda-aware property browsing
- map discovery
- polygon/drawn-area search
- saved properties and saved searches
- property detail/media
- walkthrough video playback
- 360 panorama viewing
- bookings and payment initiation
- offers
- notifications
- realtime-oriented messaging
- private message attachments
- owner/listing management
- dashboard, leases and maintenance
- administrative/operations screens
- account/security/settings
- dark/light appearance
- haptic interactions
- responsive bottom-sheet search

## Run

From the repository root:

```bash
npm install
npm --prefix apps/mobile start
```

Or from `apps/mobile`:

```bash
npm install
npm start
```

Typecheck:

```bash
npm run typecheck
```

Expo diagnostics:

```bash
npm run doctor
```

## API configuration

Set the reachable NestJS API URL through the mobile environment used by the project, for example:

```text
EXPO_PUBLIC_API_URL=http://YOUR_MACHINE_IP:4000/api/v1
```

For a physical device, `localhost` normally points to the phone rather than the development computer.

## Important mobile behavior

Authentication credentials are stored through Expo SecureStore.

The app uses the existing authenticated API transport and does not replace backend contracts with local mocks.

Search uses the live search API and can combine:

- listing type
- query text
- district
- price bounds
- verification
- map center/radius
- polygon/drawn search area

The map/list experience uses a bottom sheet so customers can move between geographic discovery and result details without leaving the search surface.

## Device validation

Before release, validate on at least:

- a small Android device/emulator
- an iPhone-sized device/simulator
- 200% Dynamic Type / large accessibility text
- slow network
- offline/reconnect transitions
- keyboard-safe messaging composer
- push-notification deep links
- media/video/360 rendering
- booking/payment flows

A successful TypeScript or Expo doctor command is not equivalent to device acceptance testing.
