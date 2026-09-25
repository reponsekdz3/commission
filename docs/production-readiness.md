# Imizi production readiness map

This repository now contains the production-oriented real-estate core requested in the architecture brief. This file deliberately distinguishes code already implemented from integrations that require external credentials, infrastructure, or legal review.

## 1-10: foundation and discovery

1. Architecture — implemented as a modular monolith with NestJS API, Next.js web/admin, PostgreSQL/PostGIS, Redis, OpenSearch and object-storage abstractions.
2. Modular monolith — implemented; bounded modules live inside one API process and can be extracted later.
3. Domain model — implemented with properties, units, listings, media, availability, bookings, payments, conversations, verification, agencies, reviews, maintenance, analytics and audit data.
4. Location — implemented with latitude/longitude and PostGIS-backed search.
5. Maps — provider abstraction plus map endpoints; mobile map uses react-native-maps.
6. Search — PostgreSQL fallback plus OpenSearch read index and fuzzy/full-text filtering.
7. Ranking — implemented in domain search ranking with relevance, location, filter match, verification, quality and freshness.
8. Property marketplace — web and mobile property detail/search flows exist.
9. Media — signed-upload/object-storage foundation exists; advanced transcoding/AVIF/video pipeline remains an infrastructure integration.
10. Booking — availability validation, booking states, idempotency and database overlap protection are implemented.

## 11-20: transactions and marketplace

11. Rental flow — booking -> payment intent -> server-side confirmation flow implemented.
12. Payments — provider abstraction and MTN MoMo flow are implemented; provider credentials and any additional gateway adapter are deployment tasks.
13. Ledger — transactional ledger accounts and settlement entries exist.
14. Messaging — REST messaging plus authenticated Socket.IO sessions and conversation rooms are implemented.
15. Notifications — in-app notifications and background-job records exist; push/SMS/email provider delivery still requires credentials/providers.
16. Saved searches — stored criteria and matching notifications are implemented.
17. Recommendations — rules-based recommendation endpoint exists.
18. Landlord dashboard — web dashboard and analytics endpoints exist.
19. Agency system — organizations, members and agency endpoints exist.
20. Verification — verification requests and admin decision flow exist.

## 21-30: trust, security and platform infrastructure

21. Anti-fraud — fraud scoring, risk levels, reports and moderation queues are implemented as a core foundation.
22. Reviews — review creation is tied to completed/eligible bookings.
23. API security — validation, throttling, Helmet, RBAC, object access checks, refresh tokens, audit logging and upload controls are implemented.
24. Resource authorization — server-side ownership/access checks are enforced for protected resources.
25. API versioning — API is exposed under /api/v1.
26. API modules — auth, users, properties, listings, search, maps, favorites, bookings, payments, offers, messages, reviews, verification, notifications, agencies, admin, media, maintenance, analytics, privacy, viewings, leases, recommendations and catalog modules exist.
27. Pagination — search uses bounded limits and cursor-shaped responses; high-scale keyset pagination remains an optimization for very large result sets.
28. Database indexes — relational and geospatial indexes exist in the schema.
29. Caching — Redis cache integration with graceful fallback exists.
30. Background jobs — durable PostgreSQL queue with SKIP LOCKED workers exists; BullMQ can be introduced later as a queue extraction without changing domain contracts.

## 31-40: operations, UX and management

31. Analytics — event capture and platform/landlord analytics endpoints exist.
32. Mobile performance — native mobile client is structured around list virtualization and network-first data loading; image CDN processing is still an external media pipeline concern.
33. Offline — core architecture can cache state, but a complete conflict-resolving offline sync engine is not yet finished.
34. Modern UX — responsive web flows and native mobile flows exist for discovery, details, map, login and messaging.
35. Comparison — comparison page exists on web.
36. Viewing scheduler — viewing slots, requests and decision APIs exist.
37. Rental agreements — lease records and agreement generation foundation exist; production legal templates require Rwanda legal review.
38. Property management — leases, maintenance and management APIs exist.
39. Admin — admin control center and moderation/verification/audit endpoints exist.
40. Roles — role system includes platform admins, verification/finance roles, users, landlords, buyers/sellers, agents, agency admins and property managers.

## 41-50: events, storage, testing and delivery

41. Event-driven design — current implementation uses modular events/jobs and can move to a dedicated event bus later.
42. Storage — signed object-storage uploads and private/public key separation are implemented.
43. API docs — Swagger/OpenAPI is enabled at /docs.
44. Testing — domain and API tests plus DB smoke/migration tests exist; a full mobile/browser E2E matrix still needs expansion.
45. CI/CD — GitHub Actions runs database migration, seed, smoke, domain tests, API tests, typecheck and web/API builds.
46. Containers — Docker/Compose infrastructure is present.
47. Environment management — secrets/config are loaded from environment variables.
48. Backups — production backup policy and restore drills are deployment responsibilities and must be configured for the real database environment.
49. Disaster recovery — services have graceful fallbacks for search/cache and health-aware startup; full multi-region DR requires infrastructure deployment.
50. Observability — health/readiness endpoints, audit logs and runtime health checks exist; production Sentry/OpenTelemetry/Prometheus/Grafana wiring remains an infrastructure configuration task.

## 51-60: resilience, privacy, localization and advanced marketplace behavior

51. Health checks — /health, /ready and /live endpoints exist.
52. Security monitoring — authentication audit records, admin actions, fraud signals and throttling are implemented.
53. Privacy — export/delete/consent foundations exist; Rwanda compliance, registrations, retention policy and cross-border transfer approvals must be completed for the deployed business.
54. Rwanda localization — RWF and Rwanda location hierarchy are supported.
55. Internationalization — country/currency/locale fields are modeled so more African markets can be added.
56. Pricing engine — money calculations and fee/deposit/commission logic use integer minor-unit values.
57. Offers — buyer offers/counter-offers are represented in the marketplace domain.
58. Property documents — verification/document records and private-access architecture exist.
59. Search + map — search can use geo distance/radius and map-driven location queries.
60. Nearby intelligence — location/provider abstraction supports nearby places and route-oriented extensions; provider credentials determine live external place/route data.

## 61-65: future expansion and final architecture

61. 360 tours/video/floor plans/mortgage/market intelligence — these are intentionally next-stage modules, not falsely marked complete.
62. Integrated platform — discovery + marketplace + maps + booking + payment + messaging + rental/property management are connected in one domain.
63. Target architecture — the repository uses the modular-monolith architecture described in the brief.
64. Build phases — foundation, real-estate core, marketplace, transactions and management are materially implemented; advanced phase remains roadmap.
65. Final target — the codebase is positioned as a real platform rather than a listing-only UI, with external production integrations separated from business logic.

## Current deploy blockers

The codebase is not honestly “turn-key production” until the deployment environment supplies real values for database, Redis, OpenSearch, object storage, map provider keys, payment provider credentials, domain/email/SMS/push services and observability. Legal/compliance review is also required before handling real tenant/landlord identity documents or operating rental agreements in production.
