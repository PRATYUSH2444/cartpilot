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
