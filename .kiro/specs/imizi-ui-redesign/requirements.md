# Requirements Document

## Introduction

Imizi is a Rwanda real estate marketplace with a working Next.js 15 web app and an Expo React Native mobile app. The backend APIs, data-fetching hooks, and all business logic are fully operational and must remain completely unchanged. This redesign delivers a powerful, modern, fully responsive visual overhaul across every web page and mobile screen — touching only CSS, Tailwind utility classes, and TSX component layout/styles. No API calls, no hooks, no schema, and no data-fetching logic may be modified.

The design system is already defined: CSS custom properties in `globals.css` supply the colour tokens, shadows, radii, easing curves, and gradient helpers. Tailwind is configured and available. The font stack is Sora (display), Plus Jakarta Sans (body), and JetBrains Mono (mono). The 4 px spacing grid and three responsive breakpoints — mobile (< 768 px), tablet (768–1024 px), desktop (> 1024 px) — govern all layout decisions. Dark mode is supported through the `.dark` class.

---

## Glossary

- **App_Shell**: The persistent outer chrome wrapping every web page, composed of Topbar, Sidebar, MobileNav, and a content slot.
- **Topbar**: The sticky horizontal header rendered in `components/shell/topbar.tsx`.
- **Sidebar**: The collapsible vertical navigation panel rendered in `components/shell/sidebar.tsx`, visible only on desktop (≥ 1024 px).
- **MobileNav**: The fixed bottom tab bar rendered in `components/shell/mobile-nav.tsx`, visible only on mobile (< 768 px) on the web app.
- **Property_Card**: The reusable listing tile rendered by `components/property/property-card.tsx`.
- **Filter_Panel**: The collapsible filter UI rendered by `components/property/property-filters.tsx`.
- **RWF**: Rwandan Franc. All prices are formatted using the existing `formatRwf` helper.
- **Verified_Badge**: A green-checkmark pill shown when `verificationStatus === "VERIFIED"`.
- **Skeleton_Loader**: An animated shimmer placeholder shown while data is being fetched.
- **Empty_State**: A centred icon, title, and CTA block shown when a list returns zero items.
- **Glassmorphism**: The visual treatment combining `backdrop-filter: blur(...)`, semi-transparent background (`--color-glass`), and a subtle border, already supported via CSS variables.
- **Chip**: A pill-shaped interactive filter element, toggling the `.active` class.
- **Toast**: A non-blocking notification displayed by the Sonner library (already installed).
- **District_Rail**: A horizontally scrollable row of district Chips on the homepage.
- **Booking_Panel**: The action sidebar on the property detail page.
- **Hero_Section**: The full-width introductory section at the top of the homepage.
- **Search_Split**: The two-column layout on the search page pairing a scrollable results list with a sticky map.
- **Tab_Bar**: The Expo-router bottom tab navigation in the mobile app.
- **Breakpoint_Mobile**: Viewport width < 768 px.
- **Breakpoint_Tablet**: Viewport width 768–1024 px.
- **Breakpoint_Desktop**: Viewport width > 1024 px.

---

## Requirements

### Requirement 1: Design System Tokens and Global Consistency

**User Story:** As a developer, I want the redesign to consume only the existing CSS custom-property tokens and Tailwind utilities, so that dark mode, theming, and future token changes propagate everywhere automatically.

#### Acceptance Criteria

1. THE App_Shell SHALL use only `--color-*`, `--shadow-*`, `--radius-*`, `--ease-*`, and `--grad-*` CSS variables defined in `globals.css` for all colour, shadow, radius, and animation values — no hardcoded hex values except where `globals.css` itself defines them.
2. THE App_Shell SHALL apply the Sora font (`var(--font-display)`) to all headings (`h1`–`h4`) and the Plus Jakarta Sans font (`var(--font-sans)`) to all body text.
3. THE App_Shell SHALL apply JetBrains Mono (`var(--font-mono)`) to all numeric data labels, stat values, price displays, and monospace code snippets.
4. WHEN the `.dark` class is applied to the root element, THE App_Shell SHALL render all surfaces, borders, and text using the dark-mode token overrides defined in `globals.css` without any additional conditional styling.
5. THE App_Shell SHALL honour `@media (prefers-reduced-motion: reduce)` by capping animation durations at 120 ms and disabling non-essential transforms, consistent with the existing rule in `globals.css`.
6. THE App_Shell SHALL apply `--color-focus` as the focus-ring colour on all interactive elements when they receive keyboard focus, with a 2 px outline and 2 px offset, matching the existing `:focus-visible` rule.
7. WHEN a user activates the skip-link (Tab on page load), THE App_Shell SHALL display the `.skip-link` element and move focus to the main content region.

---

### Requirement 2: Topbar — Glassmorphic Sticky Header

**User Story:** As a visitor, I want a powerful, interactive sticky header that communicates the brand, provides instant navigation, and adapts across all screen sizes, so that I can always find my way around the site.

#### Acceptance Criteria

1. THE Topbar SHALL be `position: sticky; top: 0; z-index: 50` with `backdrop-filter: blur(20px)` and `background: var(--color-glass)`, matching the `.nav` class pattern in `globals.css`.
2. WHEN the page is scrolled more than 10 px, THE Topbar SHALL add `box-shadow: var(--shadow-2)` via an inline style transition (`.3s var(--ease-out)`), enhancing the glassmorphic depth effect.
3. THE Topbar SHALL render the Imizi brand mark: a 34 × 34 px rounded square (`border-radius: 11px`) with `background: var(--color-primary)` containing a `Building2` icon, followed by the wordmark "IMIZI" in the display font at 17 px with `letter-spacing: .12em`, followed by a "RW" country badge in the mono font at 9 px styled with `--color-primary` on `--color-primary-soft` background.
4. THE Topbar SHALL render primary navigation links — Discover (`/search`), Map (`/map`), Compare (`/compare`), Inbox (`/messages`) — each with a matching Lucide icon and minimum tap target of 44 × 44 px.
5. WHEN the authenticated user state is available, THE Topbar SHALL show the `UserMenu` and `NotificationsBell` components; WHEN no user is authenticated, THE Topbar SHALL show a "Sign in" CTA button linking to `/login`.
6. THE Topbar SHALL render a "List property" CTA button linking to `/manage` with `background: var(--color-primary)` and the hover lift + glow transition (`var(--shadow-glow-primary)`).
7. THE Topbar SHALL render the `CommandPalette` trigger button and the `ThemeToggle` button as icon-only controls with 44 × 44 px minimum size.
8. WHEN the viewport is at Breakpoint_Mobile, THE Topbar SHALL hide the "Discover", "Map", "Compare", and "Inbox" text nav links to prevent overflow, preserving brand, ThemeToggle, NotificationsBell, and the CTA.
9. WHEN the viewport is at Breakpoint_Tablet, THE Topbar SHALL show all nav links but may reduce horizontal padding on each link.
10. IF a nav link's `href` matches the current pathname, THEN THE Topbar SHALL apply an active indicator — a 2 px bottom border or background highlight using `--color-primary` — to that link.
11. THE Topbar SHALL meet WCAG 2.1 AA contrast ratios for all text rendered against the glassmorphic background.

---

### Requirement 3: Sidebar — Collapsible Desktop Navigation

**User Story:** As a logged-in user on desktop, I want a clean, collapsible sidebar that shows my navigation destinations with icons and labels, so that I can navigate my workspace efficiently.

#### Acceptance Criteria

1. THE Sidebar SHALL be visible only at Breakpoint_Desktop (`lg:block hidden`) and hidden at Breakpoint_Mobile and Breakpoint_Tablet.
2. THE Sidebar SHALL render two states: expanded (240 px wide, icon + label) and collapsed (80 px wide, icon only), toggled by a hamburger icon button at the top.
3. WHEN the Sidebar is expanded, THE Sidebar SHALL display navigation item labels in Plus Jakarta Sans at 13 px font-weight 600 next to each 18 px Lucide icon.
4. WHEN the Sidebar is collapsed, THE Sidebar SHALL display only the 18 px Lucide icon centred in each 44 × 44 px tap target, with a tooltip showing the label on hover.
5. IF the current route matches a nav item's `href`, THEN THE Sidebar SHALL apply `background: var(--color-primary-soft); color: var(--color-primary)` to that item.
6. THE Sidebar SHALL persist its collapsed/expanded state in `localStorage` under the key `imizi_sidebar`.
7. THE Sidebar SHALL render navigation items for Dashboard, Discover, Saved, Bookings, Messages, and Properties, each with the appropriate Lucide icon.
8. THE Sidebar SHALL render with `background: var(--color-surface-1)` and a right border `1px solid var(--color-border)`, with 12 px internal padding.
9. WHEN the Sidebar toggle button is activated, THE Sidebar SHALL animate its width transition using `transition: width 0.25s var(--ease-out)`.

---

### Requirement 4: MobileNav — Bottom Tab Bar (Web)

**User Story:** As a mobile web user, I want a bottom navigation bar with clear icons and labels for the five primary destinations, so that I can navigate easily with my thumb.

#### Acceptance Criteria

1. THE MobileNav SHALL be `position: fixed; bottom: 0; left: 0; right: 0; z-index: 40` with `backdrop-filter: blur(...)` and `background: var(--color-glass)`, separated from content by `border-top: 1px solid var(--color-border)`.
2. THE MobileNav SHALL be hidden at Breakpoint_Tablet and Breakpoint_Desktop using `md:hidden`.
3. THE MobileNav SHALL render exactly five tab items: Home (`/`), Search (`/search`), Saved (`/favorites`), Inbox (`/messages`), and Account (`/workspace`), each with a Lucide icon and a text label below it.
4. WHEN the current pathname matches a tab item's `href`, THE MobileNav SHALL apply `color: var(--color-primary)` and a small indicator dot or filled icon to the active tab.
5. THE MobileNav SHALL render each tab item with a minimum touch target of 44 × 44 px and the label text at 10 px.
6. THE MobileNav SHALL add bottom safe-area padding (`env(safe-area-inset-bottom)`) to prevent content being hidden behind device home indicators.
7. THE MobileNav SHALL provide a smooth `color` transition (0.15 s) when switching active state between tabs.

---

### Requirement 5: Homepage — Hero Section

**User Story:** As a first-time visitor, I want a visually striking hero section with a powerful headline, an instant search bar, quick-filter chips for listing types, and social proof stats, so that I can immediately understand what Imizi offers and start searching.

#### Acceptance Criteria

1. THE Homepage SHALL render a full-width hero section with a radial gradient background (`var(--grad-hero)`) that decorates the top-left and top-right regions without obscuring text.
2. THE Homepage SHALL display an eyebrow badge — an inline pill with a pulsing `statusDot` and text "Rwanda's Property Marketplace" — above the main headline.
3. THE Homepage SHALL render a headline using the `.heroCopy h1` pattern: `font-size: clamp(3.2rem, 5.6vw, 6.2rem)`, `letter-spacing: -0.075em`, where the primary keyword (e.g. "Property") is wrapped in a `<span>` styled with `color: var(--color-primary)`.
4. THE Homepage SHALL render a search card (`heroSearchCard`) with three columns at Breakpoint_Desktop: a text input with a location/keyword placeholder, a listing-type `<select>`, and a dark search button that transitions to `--color-primary` on hover.
5. WHEN the viewport is at Breakpoint_Mobile, THE Homepage search card SHALL collapse to a single-column stack.
6. THE Homepage SHALL render a row of quick-filter Chips below the search card for "Rent", "Buy", "Short Stay", "Verified Only", and "Map View", each toggling the `.heroQuick.active` style on click.
7. THE Homepage SHALL render social-proof stats (properties count, active listings, verified count) using the `.heroProof` layout: icon + bold number + small description label.
8. THE Homepage SHALL render an animated product showcase card (`heroProductCard`) beside the hero copy at Breakpoint_Desktop that displays a decorative map preview with floating pin animations, mini stat panels, and a mini CTA panel — all purely decorative and non-interactive beyond the card's hover lift.
9. WHEN the viewport is at Breakpoint_Tablet or Breakpoint_Mobile, THE Homepage SHALL stack the hero copy above the product card in a single column, and the product card SHALL render without its `rotate(1deg)` tilt.

---

### Requirement 6: Homepage — District Rail and Featured Listings

**User Story:** As a visitor, I want to browse properties by Kigali district and see featured listings in a responsive grid, so that I can discover properties relevant to my target neighbourhood.

#### Acceptance Criteria

1. THE Homepage SHALL render a District_Rail section with a scrollable row of district cards, each showing a district name, property count, and a chevron-right icon, styled with `--color-primary` left accent and hover lift (`translateY(-2px)` + `--shadow-2`).
2. WHEN the viewport is at Breakpoint_Desktop, THE District_Rail SHALL display in a 4-column grid; WHEN at Breakpoint_Tablet, in a 3-column grid; WHEN at Breakpoint_Mobile, in a 2-column grid.
3. THE Homepage SHALL render a "Featured Properties" section heading using the `.sectionHeadingModern` pattern with a "View all →" text link right-aligned.
4. THE Homepage SHALL render featured Property_Cards in a responsive grid: 4 columns at Breakpoint_Desktop, 2 columns at Breakpoint_Tablet, 1 column at Breakpoint_Mobile.
5. WHILE featured listings are loading, THE Homepage SHALL display Property_Card Skeleton_Loaders in the same grid layout as the actual cards.
6. IF the featured listings API returns zero items, THEN THE Homepage SHALL display an Empty_State with a house icon, "No featured listings yet" title, and a "Browse all properties →" CTA.
7. THE Homepage SHALL render a "How it Works" section with a 4-step workflow grid (`workflowGrid`), each card showing a step number (mono font), icon, title, and 2-line description with hover lift.
8. WHEN the viewport is at Breakpoint_Mobile, THE "How it Works" workflow grid SHALL collapse to a 1-column stack.
9. THE Homepage SHALL render an owner-acquisition banner (`ownerBanner`) with a dark-green gradient background, headline, subtext, and two CTA buttons — "List your property" (white fill) and "Learn more" (ghost/transparent).
10. THE Homepage SHALL render a capability strip (`capabilityStrip`) above the footer with 4 feature cards (Maps, Verified, Bookings, Payments), each with a `capIcon`, bold label, and 9 px description, responsive to 2 columns on tablet and 1 column on mobile.

---

### Requirement 7: Property_Card Component

**User Story:** As a user browsing listings, I want every property card to clearly show the image, price in RWF, title, location, bedroom/bathroom/area specs, verified status, and save/share actions, so that I can quickly compare properties without opening each one.

#### Acceptance Criteria

1. THE Property_Card SHALL render a media area with `aspect-ratio: 4/3` (default variant) or `aspect-ratio: 16/10` (large variant) and `object-fit: cover`, with a smooth `scale(1.04)` zoom on card hover (`transition: transform 0.5s var(--ease-out)`).
2. IF the property has no media, THEN THE Property_Card SHALL render a gradient placeholder with a `mediaGradient` pattern containing a home icon and "No media" label.
3. THE Property_Card SHALL render a `Verified_Badge` — a white/90 pill with a green `CheckCircle` icon and "Verified" label — in the top-left of the media area WHEN `verificationStatus === "VERIFIED"`.
4. THE Property_Card SHALL render a property-type badge in the top-left of the media area (below Verified_Badge if present) using a dark semi-transparent pill.
5. THE Property_Card SHALL render a 36 × 36 px circular Save button in the top-right of the media area: white/90 fill when unsaved, `--color-primary` fill when saved, toggling on click with an optimistic UI update and a Toast notification.
6. THE Property_Card SHALL render a Share button (36 × 36 px circle) adjacent to the Save button, invoking the Web Share API when available, otherwise copying the property URL to clipboard and showing a Toast.
7. THE Property_Card SHALL render a photo-count badge in the bottom-left of the media area when `media.length > 1`.
8. THE Property_Card SHALL render a Compare button (pill) in the bottom-right of the media area using the `useCompareStore` hook.
9. THE Property_Card SHALL render the price using `formatRwf` in the display font at 20 px font-weight 800, followed by "/mo" or "/night" in muted 14 px when the listing type is RENT or SHORT_STAY.
10. THE Property_Card SHALL render the property title in 15 px font-weight 700, truncated to 2 lines with `line-clamp-2`.
11. THE Property_Card SHALL render the location (sector + district) with a `MapPin` icon at 11 px in `--color-fg-muted`, truncated to one line.
12. THE Property_Card SHALL render a specs row showing bedrooms (`BedDouble`), bathrooms (`Bath`), and area (`Ruler`) in 11 px font-weight 600 separated by a `--color-border` divider line.
13. THE Property_Card SHALL apply a `translateY(-6px)` lift and `--shadow-3` box-shadow on card hover, transitioning over `0.25s var(--ease-out)`.
14. THE Property_Card SHALL have a minimum tap target of 44 × 44 px for all interactive overlay buttons (Save, Share, Compare).
15. WHILE the `useSaveFavorite` mutation is pending, THE Property_Card SHALL set the Save button to `disabled` and show a spinner overlay on the button.

---

### Requirement 8: Search Page — Split Map + List Layout

**User Story:** As a property seeker, I want to see a live-updating map alongside a scrollable results list with filters, so that I can explore properties both spatially and by their details simultaneously.

#### Acceptance Criteria

1. THE Search_Page SHALL render a `searchSplit` two-column layout: the list panel occupies 55% of the viewport width and the map panel occupies 45%, both filling `calc(100vh - 73px)` in height at Breakpoint_Desktop.
2. THE Search_Page list panel SHALL be independently scrollable (`overflow-y: auto`) without the page itself scrolling.
3. THE Search_Page map panel SHALL be `position: sticky; top: 73px` so it remains fixed while the list scrolls at Breakpoint_Desktop.
4. WHEN the viewport is at Breakpoint_Mobile, THE Search_Page SHALL stack the map above the list, with the map at 45 vh and the list below it.
5. THE Search_Page list panel SHALL render the page heading ("Find your next property.") using the `.page-heading` class, a muted subtitle, and a "Map" ghost-button link at Breakpoint_Desktop only.
6. THE Search_Page SHALL render the Filter_Panel immediately below the heading row.
7. THE Search_Page SHALL render a listing-type Chip row ("Rent", "Buy", "Short Stay") and a `SavedSearchChip` below the Filter_Panel.
8. THE Search_Page SHALL render a result-count label (`<b>{count}</b> live results`) and a "Rwanda" locale tag above the results grid.
9. WHILE `isLoading` is true, THE Search_Page SHALL render a grid of 4 Property_Card Skeleton_Loaders.
10. IF `isError` is true, THEN THE Search_Page SHALL render an error notice using the `.alert.alert-error` style.
11. THE Search_Page SHALL render results in a `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))` grid.
12. WHEN a user scrolls the list panel past a Property_Card, THE Search_Page SHALL use IntersectionObserver to set that card as `activeId`, applying a 2 px accent ring (`--color-accent`) to the card's `.card` element.
13. WHEN a map marker is clicked, THE Search_Page SHALL scroll the matching Property_Card into view in the list panel and apply the `activeId` ring to it.
14. IF the search returns zero results, THEN THE Search_Page SHALL display an Empty_State with a search icon, "No properties match" title, description, and "Reset search" CTA.

---

### Requirement 9: Filter_Panel Component

**User Story:** As a property seeker, I want a compact, visually refined filter panel that shows active filters as badges and expands to reveal all filter controls, so that I can narrow results without cluttering the interface.

#### Acceptance Criteria

1. THE Filter_Panel SHALL render a collapsed header row showing a "Filters" toggle button (with `SlidersHorizontal` icon and `ChevronDown` rotation on open), followed by active-filter Badges and a "Clear all" badge.
2. THE Filter_Panel SHALL use `background: var(--color-glass); backdrop-filter: blur(...)` with `border: 1px solid var(--color-border)` and `border-radius: var(--radius-xl)`.
3. WHEN the panel is open, THE Filter_Panel SHALL animate the filter grid into view; WHEN closed, THE Filter_Panel SHALL hide the grid without layout shift.
4. THE Filter_Panel expanded grid SHALL render 5 filter controls: Property Type (select), District (select), Min Bedrooms (chip group), Max Price (slider with RWF label), and Verified Only (switch).
5. WHEN the viewport is at Breakpoint_Desktop, THE Filter_Panel expanded grid SHALL display 5 columns; WHEN at Breakpoint_Tablet, 3 columns; WHEN at Breakpoint_Mobile, 1 column.
6. THE Filter_Panel SHALL apply active-filter badge colours consistently: blue for property type, green for district and verified, grey for bedrooms and max price, using the existing `.badge-*` classes.
7. WHEN any filter control changes value, THE Filter_Panel SHALL call `router.replace` to update the URL search params without triggering a full page reload (`scroll: false`).
8. WHEN the "Clear all" badge is clicked, THE Filter_Panel SHALL reset all filter state and remove all filter keys from the URL params.

---

### Requirement 10: Property Detail Page

**User Story:** As a property seeker, I want a rich property detail page with a full-screen gallery, structured specs, description, amenities, map, and a sticky booking panel, so that I have all the information I need to commit to a viewing or booking.

#### Acceptance Criteria

1. THE Property_Detail_Page SHALL render a full-width `PropertyGallery` hero image area with `height: 60vh; min-height: 420px` at the top of the page.
2. THE Property_Detail_Page SHALL render a two-column layout below the gallery: a main article column (spanning roughly 60%) and a sticky aside column (spanning roughly 40%) at Breakpoint_Desktop.
3. WHEN the viewport is at Breakpoint_Mobile or Breakpoint_Tablet, THE Property_Detail_Page SHALL stack the article and aside into a single column, with the aside rendering below the article.
4. THE Property_Detail_Page main article SHALL render a badge row with Verified_Badge and property-type pill using `.pill` styling.
5. THE Property_Detail_Page main article SHALL render the property title using `.page-heading` at `clamp(2rem, 5vw, 3.6rem)` font size with view-transition name `property-title-{id}`.
6. THE Property_Detail_Page main article SHALL render the location breadcrumb (sector, district, province, country code) in `--color-fg-muted` at 14 px below the title.
7. THE Property_Detail_Page main article SHALL render a 4-column spec grid (Beds, Baths, Parking, Area) at Breakpoint_Desktop and a 2-column grid at Breakpoint_Mobile, each spec in a `.panel` card.
8. THE Property_Detail_Page main article SHALL render the property description section using `dangerouslySetInnerHTML` with DOMPurify sanitisation, styled with `.prose` typography.
9. THE Property_Detail_Page main article SHALL render the amenities section using the `AmenityList` component.
10. WHEN `latitude` and `longitude` are valid numbers, THE Property_Detail_Page SHALL render a `PropertyMap` component in a `18px` border-radius container of `height: 380px`.
11. THE Property_Detail_Page aside SHALL render the listing price using `.price-display` (`font-size: 28px; font-weight: 900`) with "/month" or "/night" suffix styled in `--color-fg-muted`.
12. THE Property_Detail_Page aside SHALL be `position: sticky; top: 88px` and `max-height: calc(100vh - 100px); overflow-y: auto` at Breakpoint_Desktop.
13. THE Property_Detail_Page aside SHALL render a `Booking_Panel` or a "Contact owner" message when no listing is available.
14. THE Property_Detail_Page SHALL render a sticky mobile bottom bar (`.bottomBar`) at Breakpoint_Mobile containing the price and a "Book" CTA button, hidden at Breakpoint_Desktop.

---

### Requirement 11: Booking_Panel Component

**User Story:** As a property seeker viewing a detail page, I want a clean booking panel with date pickers, a quote calculator, and action buttons, so that I can initiate a booking, viewing, or message without navigating away.

#### Acceptance Criteria

1. THE Booking_Panel SHALL render start and end date inputs using `<input type="date">` styled with the `.field` class and a 44 px minimum height.
2. THE Booking_Panel SHALL render a "Calculate quote" ghost button that triggers the quote API call and displays the returned base, deposit, service fee, and total in a `.panel` card below the inputs.
3. THE Booking_Panel SHALL render a primary CTA button ("Book & pay" or "Start purchase" depending on listing type) that initiates the booking flow.
4. THE Booking_Panel SHALL render secondary ghost buttons for "Book a viewing" and "Message owner".
5. WHEN `listingType === "SALE"`, THE Booking_Panel SHALL render an offer input and "Submit offer" button.
6. WHEN a Booking_Panel action completes or fails, THE Booking_Panel SHALL display a status message in a `.notice` element below the buttons.
7. THE Booking_Panel SHALL disable the primary CTA button and show a loading indicator WHILE a mutation is in progress (`busy === true`).

---

### Requirement 12: Login Page

**User Story:** As a returning user, I want a focused, visually polished sign-in form with clear validation feedback, so that I can authenticate quickly and with confidence.

#### Acceptance Criteria

1. THE Login_Page SHALL center its form card horizontally and vertically within the page content area, with the card capped at 440 px width.
2. THE Login_Page SHALL render an eyebrow label "Secure account", a headline "Welcome back.", and a muted sub-text paragraph.
3. THE Login_Page form SHALL render three `Input` fields — Email or phone, Password, MFA code (optional) — each with a visible label, error message slot, and the `.field` class styling.
4. IF form validation fails, THEN THE Login_Page SHALL render inline error messages below each invalid field in `--color-danger` at 12 px.
5. IF the sign-in API returns an error, THEN THE Login_Page SHALL render an `.alert.alert-error` block above the submit button.
6. THE Login_Page SHALL render a "Sign in" primary button with loading state ("Signing in…" + disabled) WHILE `isSubmitting` is true.
7. THE Login_Page SHALL render a bottom row with a muted "Forgot password?" link and a primary-coloured "Create account" link.
8. THE Login_Page SHALL render a decorative split-panel layout at Breakpoint_Desktop: the left 50% shows a branded illustration/gradient panel; the right 50% shows the form.

---

### Requirement 13: Register Page

**User Story:** As a new user, I want a clear registration form that collects my full name, email, phone, and password with live validation, so that I can create my account without confusion.

#### Acceptance Criteria

1. THE Register_Page SHALL follow the same centered card layout as the Login_Page, capped at 480 px, with the split-panel decoration at Breakpoint_Desktop.
2. THE Register_Page SHALL render an eyebrow label "Create account", a headline, and a brief value-proposition subtext.
3. THE Register_Page form SHALL render fields for Full name, Email, Phone number, Password, and Confirm password, each with visible labels and error message slots.
4. IF password and confirm-password values do not match, THEN THE Register_Page SHALL render an inline error "Passwords do not match" on the confirm-password field.
5. WHILE `isSubmitting` is true, THE Register_Page SHALL disable the submit button and show a "Creating account…" label.
6. THE Register_Page SHALL render a "Already have an account? Sign in" link below the form.

---

### Requirement 14: Dashboard Page

**User Story:** As a property owner, I want a data-rich dashboard with stat cards, a revenue chart, a properties list, and a recent bookings list, so that I can monitor my portfolio performance at a glance.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL render a page heading row with "Good to see you.", a muted subtitle, and action buttons ("New listing" primary, "View messages" ghost) using the `.sectionHead` + `.actions` pattern.
2. THE Dashboard_Page SHALL render a 4-column stats grid at Breakpoint_Desktop (2 columns at Breakpoint_Tablet, 1 column at Breakpoint_Mobile) with `stat-card` tiles for Properties, Active, Views, and Bookings — each showing an animated `Counter` value, a `stat-label`, and a "Live metric" delta badge.
3. WHILE `isLoading` is true, THE Dashboard_Page SHALL render 4 Skeleton_Loaders in the stats grid matching the `stat-card` dimensions.
4. THE Dashboard_Page SHALL render a two-column panel grid below the stats: a revenue `AreaChart` panel (left, wider) and an occupancy donut panel (right, narrower) at Breakpoint_Desktop, collapsing to 1 column at Breakpoint_Mobile.
5. THE Dashboard_Page revenue chart panel SHALL render a Recharts `AreaChart` with a primary-green gradient fill, a styled tooltip (glass background, border, 12 px radius), and no visible axes at narrow widths.
6. THE Dashboard_Page SHALL render a "Your properties" section below the chart panels with a list of up to 8 properties as `.card-row` rows (title, district+status, "Open" pill), linking each to `/properties/{id}`.
7. THE Dashboard_Page SHALL render a "Recent bookings" section beside the properties list at Breakpoint_Desktop with up to 8 booking rows (ID truncated to 8 chars, date range, status pill).
8. IF the properties array is empty, THEN THE Dashboard_Page SHALL render an Empty_State in the properties section.
9. IF the bookings array is empty, THEN THE Dashboard_Page SHALL render an Empty_State in the bookings section.

---

### Requirement 15: Manage Page (Create/Edit Property)

**User Story:** As a property owner, I want a well-structured property management form with a clear section layout and helpful labels, so that I can create or edit a listing accurately.

#### Acceptance Criteria

1. THE Manage_Page SHALL render a page heading, subtext, and a multi-section form card using `.panel` styling.
2. THE Manage_Page form SHALL group fields into clearly labelled sections: Basic Info, Location, Pricing, Media, Amenities, and Availability.
3. THE Manage_Page form fields SHALL use the `.field` and `.field-group` classes consistently with visible labels and placeholder hints.
4. WHEN the form is submitted, THE Manage_Page SHALL show a loading state on the submit button and disable all inputs.
5. IF the API returns a validation error, THEN THE Manage_Page SHALL display inline errors beside the relevant fields.
6. THE Manage_Page SHALL render a `MediaUploader` component in the Media section with a drag-drop zone indicator.
7. THE Manage_Page SHALL be fully usable at Breakpoint_Mobile with all fields stacked in a single column.

---

### Requirement 16: Messages Page

**User Story:** As a user, I want a two-panel messages view with a conversation list on the left and a message thread on the right, so that I can manage all my property communications from one screen.

#### Acceptance Criteria

1. THE Messages_Page SHALL render a two-column layout at Breakpoint_Desktop: a conversation list (36% width) on the left and a message thread (64% width) on the right, both filling the available height minus the Topbar height.
2. WHEN the viewport is at Breakpoint_Mobile, THE Messages_Page SHALL render a single-column view showing the conversation list by default, with a tap on a conversation navigating to the thread view.
3. THE Messages_Page conversation list SHALL render each conversation as a `.card-row` with avatar, sender name, last message preview (truncated), unread count badge, and timestamp.
4. THE Messages_Page message thread SHALL render chat bubbles: sent messages right-aligned with `--color-primary` background, received messages left-aligned with `--color-surface-3` background.
5. THE Messages_Page message thread SHALL render a sticky input bar at the bottom of the thread with a text input, an emoji button, and a send button.
6. WHILE messages are loading, THE Messages_Page SHALL render Skeleton_Loaders in both the conversation list and the thread area.
7. IF no conversation is selected on Breakpoint_Desktop, THE Messages_Page SHALL render an Empty_State in the thread panel with "Select a conversation" copy.

---

### Requirement 17: Bookings Page

**User Story:** As a user, I want a clear list of my bookings with status badges, dates, and quick-action buttons, so that I can manage my upcoming and past bookings efficiently.

#### Acceptance Criteria

1. THE Bookings_Page SHALL render a page heading, subtext, and a filter Chip row for booking status (All, Pending, Confirmed, Cancelled, Completed).
2. THE Bookings_Page SHALL render each booking as a `.card-row` containing a truncated booking ID, property name, date range, status badge (`.badge-green` for Confirmed, `.badge-amber` for Pending, `.badge-gray` for Completed, `.badge-red` for Cancelled), and an action button.
3. WHILE bookings are loading, THE Bookings_Page SHALL render 4 Skeleton_Loaders matching the `.card-row` dimensions.
4. IF the filtered bookings array is empty, THEN THE Bookings_Page SHALL render an Empty_State with "No bookings found" and a "Browse properties" CTA.
5. THE Bookings_Page SHALL be fully responsive: at Breakpoint_Mobile, each booking row SHALL stack its details vertically.

---

### Requirement 18: Favorites Page

**User Story:** As a user, I want to view all my saved properties in the same grid layout as the main search, so that I can revisit and compare the properties I've shortlisted.

#### Acceptance Criteria

1. THE Favorites_Page SHALL render a page heading "Saved properties", a property count, and a "Clear all" action.
2. THE Favorites_Page SHALL render Property_Cards in the same responsive grid pattern as the homepage featured listings: 4 columns at Breakpoint_Desktop, 2 at Breakpoint_Tablet, 1 at Breakpoint_Mobile.
3. WHILE favorites are loading, THE Favorites_Page SHALL render 4 Property_Card Skeleton_Loaders.
4. IF the favorites array is empty, THEN THE Favorites_Page SHALL render an Empty_State with a heart icon, "Nothing saved yet" title, and a "Start exploring →" CTA linking to `/search`.
5. THE Favorites_Page SHALL not implement any save/unsave mutations; it SHALL rely solely on the existing `useFavorites` hook for data.

---

### Requirement 19: Map Page

**User Story:** As a property seeker, I want a full-screen interactive map that shows all live property pins, so that I can explore listings geographically without distraction.

#### Acceptance Criteria

1. THE Map_Page SHALL render the Mapbox map at full viewport height (`100dvh`) minus the Topbar height, with zero margins or padding around the map container.
2. THE Map_Page SHALL remove the `margin` and `border-radius` applied by the `.realMap` class, allowing the map to bleed to the edges of the content area.
3. THE Map_Page SHALL render a floating search-filter card overlaid on the top-left of the map (`position: absolute`) with glassmorphic styling for keyword and district inputs.
4. THE Map_Page SHALL render floating "Back to list" and "Draw boundary" action buttons overlaid on the bottom-right of the map.
5. THE Map_Page map container SHALL render within a `<main>` element without the `.wrap` container constraint so it can fill the full viewport width.

---

### Requirement 20: Notifications Page

**User Story:** As a user, I want a clean notifications list with unread indicators, category icons, and timestamps, so that I can stay informed about activity on my account and properties.

#### Acceptance Criteria

1. THE Notifications_Page SHALL render a page heading, an unread count badge, and a "Mark all read" action button.
2. THE Notifications_Page SHALL render each notification as a `.card-row` with: a category icon (message, booking, property, system) in a `--color-primary-soft` circle, notification text, relative timestamp (e.g. "2 hours ago"), and an unread dot indicator on the left.
3. WHEN a notification has `read: false`, THE Notifications_Page SHALL apply a left-border highlight (`3px solid var(--color-primary)`) and a slightly elevated background (`--color-surface-2`) to that row.
4. WHILE notifications are loading, THE Notifications_Page SHALL render 5 Skeleton_Loaders matching the `.card-row` height.
5. IF the notifications array is empty, THEN THE Notifications_Page SHALL render an Empty_State.

---

### Requirement 21: Workspace / Profile Page

**User Story:** As a logged-in user, I want a profile workspace page that shows my account info, avatar, settings links, and quick-action cards, so that I can manage my identity and preferences from one place.

#### Acceptance Criteria

1. THE Workspace_Page SHALL render a profile header card with the user's avatar (initials fallback), full name in display font at 22 px, email in `--color-fg-muted`, and an "Edit profile" button.
2. THE Workspace_Page SHALL render a 2-column quick-action grid at Breakpoint_Desktop (1 column at Breakpoint_Mobile) with cards for: My Listings, Bookings, Messages, Saved, Payments, and Settings.
3. THE Workspace_Page SHALL render a settings section with toggle rows for notifications, dark mode, and data-saver mode.
4. THE Workspace_Page SHALL render a "Sign out" ghost button at the bottom of the page.

---

### Requirement 22: Mobile Home Tab

**User Story:** As a mobile app user, I want a visually powerful home screen with a hero search card, quick-action buttons, and a featured listings feed, so that I can search and discover properties efficiently on my phone.

#### Acceptance Criteria

1. THE Mobile_Home_Tab SHALL render a brand badge pill (display font "IMIZI", live status dot in `--color-primary`) and a status sub-label in the hero card header.
2. THE Mobile_Home_Tab hero card SHALL use `borderWidth: 1, borderRadius: radius.xl` with `backgroundColor: c.surface` and `borderColor: c.border` from the theme palette.
3. THE Mobile_Home_Tab SHALL render a headline ("Find a place\nthat fits.") using `fonts.displayStrong` at `typography.display` size with `letterSpacing: -1.4`.
4. THE Mobile_Home_Tab SHALL render a listing-type Chip row (Rent, Buy, Stay) with smooth haptic feedback (`selection()`) on press.
5. THE Mobile_Home_Tab SHALL render four quick-action cards in a 2-column flex-wrap grid: Map, Saved, Bookings, and List Property — each with a coloured icon container (`radius.md`), bold label, and sub-label.
6. THE Mobile_Home_Tab "List Property" quick-action card SHALL use `c.accentSoft` / `c.accentText` colours for its icon container.
7. THE Mobile_Home_Tab SHALL render a `FlatList` of `PropertyCard` components below the header, with pull-to-refresh using `query.refetch`.
8. WHILE `query.isPending` is true, THE Mobile_Home_Tab SHALL render an `ActivityIndicator` in `c.primary` colour in the list empty component slot.
9. IF `query.isError && items.length === 0`, THEN THE Mobile_Home_Tab SHALL render an error text in `c.danger` colour.
10. THE Mobile_Home_Tab list SHALL apply `paddingBottom: 110 + insets.bottom` to `contentContainerStyle` to prevent content hiding behind the Tab_Bar and home indicator.

---

### Requirement 23: Mobile Search Tab

**User Story:** As a mobile app user, I want a search tab with a keyword input, filter chips, and a results list, so that I can find specific properties on my phone.

#### Acceptance Criteria

1. THE Mobile_Search_Tab SHALL render a sticky search header with a text input, listing-type Chips, and a "Filters" button at the top of the scroll view.
2. THE Mobile_Search_Tab SHALL render results as a `FlatList` of `PropertyCard` components below the header.
3. WHILE results are loading, THE Mobile_Search_Tab SHALL render skeleton placeholder cards.
4. IF the search returns zero results, THE Mobile_Search_Tab SHALL render an Empty_State with search icon and a "Refine search" prompt.
5. THE Mobile_Search_Tab SHALL include a floating "Map view" button at the bottom-right that navigates to the Map screen.
6. THE Mobile_Search_Tab SHALL apply `paddingBottom: 90 + insets.bottom` to the list's `contentContainerStyle`.

---

### Requirement 24: Mobile Saved Tab

**User Story:** As a mobile app user, I want a saved properties tab that shows my favourites in a list, so that I can revisit shortlisted properties at any time.

#### Acceptance Criteria

1. THE Mobile_Saved_Tab SHALL render a page title "Saved" and a count badge in the header area.
2. THE Mobile_Saved_Tab SHALL render saved properties as a `FlatList` of `PropertyCard` components.
3. WHILE loading, THE Mobile_Saved_Tab SHALL render skeleton cards.
4. IF the saved list is empty, THE Mobile_Saved_Tab SHALL render an Empty_State with a heart icon, "Nothing saved yet" title, and a "Explore properties" button navigating to Search.
5. THE Mobile_Saved_Tab SHALL apply bottom padding to `contentContainerStyle` to account for the Tab_Bar.

---

### Requirement 25: Mobile Messages Tab

**User Story:** As a mobile app user, I want a messages tab showing my conversations with unread counts and last message previews, so that I can manage communications on the go.

#### Acceptance Criteria

1. THE Mobile_Messages_Tab SHALL render a page title "Messages" and a total unread count badge.
2. THE Mobile_Messages_Tab SHALL render each conversation as a pressable row with: a circular avatar (initials), sender name in `fonts.sansBold`, last message preview truncated to 1 line in `fonts.sans` at 12 px, timestamp in `c.muted`, and an unread count badge when `unreadCount > 0`.
3. WHEN a conversation row is pressed, THE Mobile_Messages_Tab SHALL navigate to the individual chat screen with the conversation ID.
4. WHILE loading, THE Mobile_Messages_Tab SHALL render skeleton rows.
5. IF the conversations list is empty, THE Mobile_Messages_Tab SHALL render an Empty_State with envelope icon and "No messages yet" copy.

---

### Requirement 26: Mobile Profile Tab

**User Story:** As a mobile app user, I want a profile tab with my account info, quick-access menu items, and a sign-out option, so that I can manage my identity and navigate to account features quickly.

#### Acceptance Criteria

1. THE Mobile_Profile_Tab SHALL render a profile header with a circular avatar (initials fallback using `c.primary` background), the user's full name in `fonts.displayStrong` at 20 px, and the email in `c.muted` at 13 px.
2. THE Mobile_Profile_Tab SHALL render a menu list of pressable rows for: My Listings, Bookings, Saved Searches, Notifications, Settings, and Help — each with a left icon, label, and a right chevron icon in `c.subtle`.
3. THE Mobile_Profile_Tab SHALL render a "Sign out" button at the bottom of the menu list using `c.danger` text colour.
4. WHEN a menu row is pressed, THE Mobile_Profile_Tab SHALL navigate to the corresponding screen with haptic feedback.
5. IF the user is not authenticated, THE Mobile_Profile_Tab SHALL render a "Sign in to access your account" prompt with a `Button` navigating to the login screen instead of the profile header and menu.

---

### Requirement 27: Skeleton Loaders

**User Story:** As a user waiting for data, I want animated skeleton placeholders that match the shape of the content being loaded, so that the interface feels responsive and predictable.

#### Acceptance Criteria

1. THE Skeleton_Loader for Property_Card SHALL render a shimmer animation using the existing `.animate-shimmer` keyframe animation on a container matching the `aspect-ratio: 4/3` image area and three lines of text below.
2. THE Skeleton_Loader for `stat-card` SHALL render two shimmer blocks: a wide short block (label) and a tall narrow block (value).
3. THE Skeleton_Loader for `.card-row` SHALL render a shimmer block spanning the full row width at 64 px height.
4. THE Skeleton_Loader animation SHALL be disabled WHEN `@media (prefers-reduced-motion: reduce)` is active, showing a static muted background instead.
5. WHILE data is loading, THE App_Shell SHALL render Skeleton_Loaders in the same grid or list layout as the actual content — identical column count and gap — to prevent layout shift on data arrival.

---

### Requirement 28: Empty States

**User Story:** As a user who encounters a section with no content, I want a clear and encouraging empty state with an icon, message, and action, so that I know the section is working correctly and understand what to do next.

#### Acceptance Criteria

1. THE Empty_State component SHALL render centred within its container using `text-align: center; padding: 48px`.
2. THE Empty_State SHALL render a Lucide icon at 40 px in `--color-fg-subtle` colour appropriate to the context (e.g. `Heart` for saved, `Search` for search, `MessageCircle` for messages).
3. THE Empty_State SHALL render a title in display font at 20 px font-weight 800 and a description in `--color-fg-muted` at 14 px capped at 520 px width.
4. THE Empty_State SHALL render a CTA button below the description when an `action` prop is provided.
5. THE Empty_State container SHALL use `border: 1px dashed var(--color-border-strong); border-radius: 16px; background: var(--color-surface-1)`.

---

### Requirement 29: Toast Notifications

**User Story:** As a user performing actions (saving a property, copying a link, submitting a form), I want brief, non-blocking toast notifications that confirm the result, so that I have clear feedback without interruption.

#### Acceptance Criteria

1. THE App_Shell SHALL include the Sonner `<Toaster>` component mounted at the root layout level.
2. WHEN a property is saved, THE App_Shell SHALL display a success toast "Saved to your account".
3. WHEN a property is unsaved, THE App_Shell SHALL display a neutral toast "Removed from saved".
4. WHEN a property URL is copied via the Share button, THE App_Shell SHALL display a toast "Property link copied".
5. WHEN any API action fails, THE App_Shell SHALL display an error toast with the error message from the API response.
6. Toast notifications SHALL NOT block interaction with the rest of the page.

---

### Requirement 30: Full Responsiveness Across All Pages

**User Story:** As a user on any device, I want every page to be fully usable and visually correct at mobile, tablet, and desktop widths, so that I have a consistent experience regardless of how I access Imizi.

#### Acceptance Criteria

1. WHEN the viewport is at Breakpoint_Mobile, THE App_Shell SHALL hide the Sidebar and show the MobileNav.
2. WHEN the viewport is at Breakpoint_Desktop, THE App_Shell SHALL show the Sidebar and hide the MobileNav.
3. THE `.wrap` container SHALL apply `width: min(1440px, calc(100% - 48px))` at Breakpoint_Desktop, `calc(100% - 24px)` at Breakpoint_Mobile, as defined in `globals.css`.
4. WHEN the viewport width crosses a breakpoint boundary, NO page SHALL render a horizontal scrollbar caused by redesigned components.
5. THE App_Shell SHALL ensure all interactive elements maintain a minimum touch target of 44 × 44 px at Breakpoint_Mobile.
6. THE App_Shell SHALL ensure all typography scales gracefully: headings use `clamp()` values, body text does not drop below 14 px on any breakpoint.
7. THE App_Shell SHALL ensure form inputs have `font-size: 16px` minimum at Breakpoint_Mobile to prevent iOS automatic zoom on focus.
