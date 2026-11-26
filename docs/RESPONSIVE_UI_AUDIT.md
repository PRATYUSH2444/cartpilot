# CartPilot — Responsive UI & Design-System Overhaul: Architectural Audit

**Document Version:** 1.0.0  
**Milestone:** Phase 0 — Design System, Responsive Layout & Data-Wiring Audit  
**Target Viewports:** 320px to 3840px CSS width (at 25% to 500% zoom levels)  
**Governing Documents Verified:** `docs/UX_CONTRACT.md`, `docs/AGENT_RULES.md`, `docs/ROLE_CONTRACT.md`

---

## 1. Executive Summary & Observed Failure Analysis

On the live deployed production site (`https://cartpilot-nine.vercel.app/shopper`) at 100% browser zoom on a standard 1920×1080 display, the application exhibited severe layout breaks, content overflow, and misalignments:

1. **Oversized Base Scaling:**
   - Headers and hero banners used rigid height and width constraints (`w-full max-w-[1600px] h-20`, `min-h-[560px]`, `text-5xl`).
   - The UI appeared well-proportioned only when zoomed out to 50% (effective 3840px viewport), confirming base token dimensions were 1.5× to 2× too large and non-fluid.
2. **Critical Header Horizontal Overflow:**
   - On desktop (1024px+), the header placed logo, location chip, search input with embedded button, nav links, wishlist, wallet, cart, notifications, theme toggle, and user profile avatar in a single `nowrap` flex container with `flex-shrink-0` on almost all children.
   - At 100% zoom on 1920×1080 screens, navigation and actions beyond "Browse" overflowed past the right viewport boundary, rendering Search, Cart, Wishlist, Wallet, and Profile unreachable.
3. **Interactive Control Overlap & Multiple AI Labels:**
   - An "AI Shop" button was embedded inside the search input box (`pl-5 pr-2`), causing it to wrap awkwardly to two lines (`AI \n Shop`) and truncate the placeholder text.
   - Right next to the search box in the navigation row, a separate button was labelled "AI Assistant", creating visual and functional confusion.
4. **Header vs. Content Misalignment:**
   - The desktop header used `max-w-[1600px]`, while page content and sections used varying widths (`max-w-7xl`, `max-w-[1560px]`, `max-w-md`), causing jagged gutter margins and visual disconnect.
5. **Hero Banner & Artwork Deficiencies:**
   - Headline and the "6 AM – 9 AM" slot badge shared one horizontal line, causing awkward line breaks.
   - The kraft grocery bag illustration had hardcoded absolute positioning with negative bottom offsets (`-bottom-2 sm:-bottom-4 w-48 sm:w-64 lg:w-88`), resulting in a flat-clipped bottom edge.
   - The carousel lacked keyboard accessibility, arrow controls, and fluid aspect ratios.
6. **Data Wiring & Hardcoding:**
   - Delivery location was hardcoded to `"HSR Layout, Bengaluru"`.
   - Wallet balance displayed unformatted decimals (`₹349.0` instead of integer INR `₹349`).
   - Legacy branding tagline (`Fresh Pick · Fayda Quick`) persisted beneath the logo.
7. **The Stray Gray Bottom Pill:**
   - The grey pill at the bottom center was diagnosed: it is the custom `::-webkit-scrollbar-thumb` rendered inside the horizontal scrollbar track when page elements horizontally overflow the viewport.

---

## 2. Web App Styling Approach & Technical Baseline

- **CSS Architecture:** Tailwind CSS v3 with PostCSS and CSS custom properties (variables) defined in `apps/web/src/index.css`.
- **Typography:**
  - Headings: `Bricolage Grotesque` (`font-heading`, `font-display`).
  - Body: `Instrument Sans` (`font-body`, `font-sans`).
- **Color Palettes:**
  - Deep brand green: `#08643D` (Light) / `#43C07D` (Dark).
  - Status indicators: Go (`#08643D` / `#43C07D`), Ask (`#C98A14` / `#F0B94E`), Stop (`#D23F36` / `#FF7B73`).
  - Neutral surfaces: `--bg` (`#FAFAF7` / `#0E1411`), `--surface` (`#FFFFFF` / `#17201B`), `--line` (`#E8EAE6` / `#2A372F`).
- **No Third-Party Component Libraries:** The project strictly avoids heavy bloated UI frameworks (e.g. MUI, Chakra, AntD). All components are pure React + Tailwind tokens + accessible HTML semantics.

---

## 3. Governing Document Conformance Checklist

| Requirement | Governing Doc | Status | Action in this Milestone |
|---|---|---|---|
| Max content container 1280–1440px | `UX_CONTRACT.md` (L14) | Confirmed | Enforce single shared `max-w-[1400px]` (or `max-w-7xl`) across Header, Hero, and Sections |
| Fluid typography (16px base, no <12px) | `UX_CONTRACT.md` (L31) | Confirmed | Replace hardcoded text sizes with fluid responsive clamps |
| Sentence case, plain words, no emojis in body | `UX_CONTRACT.md` (L30), `AGENT_RULES.md` (L49) | Confirmed | Remove raw emojis from card labels; standardize on Lucide icons |
| Server cart is only source of truth | `UX_CONTRACT.md` (L7) | Confirmed | Maintain single cart query and mutation path |
| Non-negotiable Header access | User Request §4 | Confirmed | Build responsive collapse hierarchy; cart and account always reachable |
| Real backend data for all displays | `AGENT_RULES.md` (L12) | Confirmed | Create `/api/v1/system/home-content` & `/api/v1/users/me/wallet` |
| Single AI feature naming | User Request §4 | Confirmed | Standardize strictly to **"AI Assistant"** everywhere |

---

## 4. Root Causes & Corrective Architectural Plan

### 4.1 Header Overhaul (`DesktopHeader.tsx` & Mobile Navigation)
- Height reduced from 80px (`h-20`) to fluid 64px–72px (`h-16 lg:h-18`).
- Remove embedded "AI Shop" button from inside the search input. Search becomes a clean input with icon and placeholder.
- Add a dedicated standalone "AI Assistant" button adjacent to search.
- Priority Collapse Hierarchy:
  - `< 768px`: Mobile compact bar (Logo mark, truncated location, cart badge, avatar). Search in second row. Bottom tab bar.
  - `768px – 1023px`: Tablet bar (Logo, location chip, search, cart, avatar dropdown).
  - `1024px – 1279px`: Desktop compact (Logo, location, search, AI Assistant button, wallet chip, cart, avatar dropdown). Wishlist, notifications, theme toggle move inside avatar dropdown.
  - `1280px+`: Full desktop (Nav links, search, AI Assistant button, wishlist, wallet, cart, notifications, theme toggle, avatar).

### 4.2 Hero Banner Scale & Illustration Fix (`HomeScreen.tsx`)
- Height capped at 340px–380px on desktop (down from 565px).
- Headline scaled fluidly to `clamp(1.75rem, 3vw, 2.75rem)` (28px to 44px max).
- Delivery window slot ("6 AM – 9 AM") moved to its own chip row beneath the headline.
- Complete SVG/CSS illustration with intrinsic aspect ratio that scales inside padding without flat bottom clipping.
- Interactive carousel controls: swipe on touch, previous/next buttons on desktop, accessible dots with $\ge 44$px tap targets.

### 4.3 Container System & Elimination of Horizontal Overflow
- All screen wrappers (`DesktopHeader`, `HomeScreen`, `BrowseScreen`, `CartScreen`, `AccountScreen`) bound to one shared container utility: `w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- Flex containers configured with `min-w-0` and truncation on text children to eliminate horizontal overflow.

### 4.4 Data Wiring & Endpoints
- **Location:** Connect header address chip to `selectedAddress` from `/api/v1/addresses`. If none, prompt "Select Location" and trigger `AddressModal`.
- **Wallet:** Add `/api/v1/users/me/wallet` endpoint in `apps/api` with balance in paise and top-up support. Format balances as integer INR (`₹349`, not `₹349.0`).
- **Home Content:** Add `/api/v1/system/home-content` endpoint delivering verified banners, offers, and value props.
