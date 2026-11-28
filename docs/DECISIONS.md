# Architecture Decisions Record (ADR) — Module 10

## ADR 1: Hub-and-Spoke Dark Store Consolidated Model vs Direct Merchant Dispatch

- **Status**: Approved & Enforced
- **Context**: A shopper order often contains fresh produce (vegetables) from a farmer/greens supplier and spices/staples from a kirana store. Having each merchant deliver individually to the customer creates multiple delivery fees, split delivery times, and high carbon emissions.
- **Decision**: Adopt a **Hub-and-Spoke Dark-Store Model**.
  1. All customer orders are placed against the central CartPilot platform.
  2. The company operates a central Dark Store / Cross-Dock Hub.
  3. Runners collect wholesale crates from each merchant in consolidated morning/evening runs.
  4. The hub sorts, packs, and quality-checks the single consolidated basket for the customer.
  5. A single CartPilot delivery driver delivers the complete basket to the customer.

---

## ADR 2: Strict Privacy Shield (Zero Customer PII for Merchants)

- **Status**: Approved & Enforced
- **Context**: Allowing multiple independent third-party merchants to see consumer names, phone numbers, and home addresses creates severe privacy, stalking, and data leakage risks.
- **Decision**:
  - The API MUST filter out `shippingAddressSnapshot`, customer name, customer phone, customer payment total, and unrelated merchant items from any merchant-facing endpoint (`/merchants/my-store/orders`, `/merchants/my-store/lots`).
  - Merchants receive ONLY: Lot ID, product SKU, package size, quantity to supply, and pickup schedule.

---

## ADR 3: Delivery Slots & Cutoff Logic

- **Status**: Approved & Enforced
- **Context**: Next-day pure-veg groceries require predictable harvesting and procurement.
- **Decision**:
  - Orders placed before 12:00 Midnight are routed to the **Next-Day Morning Slot (06:00 AM – 10:00 AM)**.
  - Orders placed before 02:00 PM are routed to the **Same-Day Evening Slot (05:00 PM – 09:00 PM)**.
  - The aggregation engine automatically bundles order items into **Fulfilment Runs** and **Merchant Lots** matching these windows.

---

## ADR 4: Marketplace Commission & Integer Paise Accounting

- **Status**: Approved & Enforced
- **Context**: Financial integrity requires preventing floating-point rounding errors across line-item commissions and settlements.
- **Decision**:
  - All monetary values (`unitPricePaise`, `subtotalPaise`, `commissionPaise`, `payoutPaise`) MUST be stored and computed as integer paise.
  - Every order item snapshot captures the exact price and commission take-rate at checkout time, ensuring immutable ledger records.

---

## ADR 5: Role-Gated Workspaces & Anti-Leakage Navigation

- **Status**: Approved & Enforced
- **Context**: Browsers caching credentials or maintaining cross-role cookies can lead to unexpected UI behavior when switching between Shopper, Merchant, and Admin views.
- **Decision**:
  - Server-side role enforcement on every API route via `requireRole('ADMIN')` and `requireRole('MERCHANT')`.
  - Client-side navigation guards with clear 1-click role switcher in development/demo mode to allow frictionless evaluation of all 3 portals without session locking.

---

## ADR 6: Live Geolocation Engine, Multi-Sample Refinement & Locality-Level Label Architecture (Module 11)

- **Status**: Approved & Enforced
- **Context**: Shoppers expect automatic location detection similar to Blinkit/Zepto/Swiggy without displaying private unit, tower, or flat numbers. In mobile and desktop browsers, a single GPS reading often has coarse accuracy.
- **Decision**:
  - Implement a dedicated `LocationService` with multi-sample `watchPosition` refinement (sampling up to 8s or until accuracy <= 50m, selecting the lowest accuracy reading).
  - Reverse geocode addresses using a pluggable server-side geocoder adapter (Google Geocoding / OpenStreetMap Nominatim fallback / TTL-indexed MongoDB cache).
  - Enforce pure **Locality Label Stripping**:
    - Strip all apartment/tower/flat/unit/plot/floor identifiers (`Tower 5, Flat 1203, La Residencia` -> `La Residencia, Greater Noida`).
    - Construct `label` as Society/Locality + City, and `subLabel` as District, State, PIN.
    - Keep labels clean, human-readable, and under 40 characters.

---

## ADR 7: Service Areas Data Model, Fallback Chain, & Admin Enforcement Modes

- **Status**: Approved & Enforced
- **Context**: Hardcoding delivery cities (like Patna or Bengaluru) in codebase strings creates brittle deployments and prevents multi-city expansion.
- **Decision**:
  - Store delivery zones dynamically in `service_areas` collection (indexed by pincode, city, and status).
  - Support three enforcement levels: `off` (allow all), `report_only` (allow all while logging demand events), and `on` (strict serviceability gating).
  - Fail-safe guard: If zero active service areas exist at runtime, automatically run in `report_only` mode with admin warning banner so shoppers are never locked out accidentally.
  - Server-authoritative checkout verification: Validate serviceability against the shipping address snapshot on order placement.

---

## ADR 8: "Coming Soon" Full Page Experience & Real-Time Waitlist Demand Tracking

- **Status**: Approved & Enforced
- **Context**: When a user is in an unserviceable locality (e.g. Greater Noida while dark store is elsewhere), displaying a raw error or generic modal causes user drop-off.
- **Decision**:
  - Render a warm, interactive, responsive **"Coming Soon"** page when unserviceable and enforcement is `on`.
  - Provide 1-tap "Notify me when we arrive" waitlist subscription with explicit DPDP consent timestamping.
  - Allow seamless switching to other addresses/pincodes or browsing nearby served regions.
  - Log pseudonymized demand metrics (`location_events` with 180-day TTL) aggregated into `location_demand_daily` for the Admin Demand Dashboard.
  - Listen for real-time `location.serviceability.changed` events so that activating an area in the Admin console immediately flips the user's active Coming Soon page into the shopping experience live!

