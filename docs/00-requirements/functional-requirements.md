# CartPilot — Functional Requirements Specification

This document details the functional acceptance contract for the CartPilot platform (FR-01 through FR-18).

---

## Requirements Matrix

| ID        | Module / Area               | Summary Requirement                           | Acceptance Condition                                                                                                                                                                                                          |
| :-------- | :-------------------------- | :-------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FR-01** | Account Management          | Secure authentication & session lifecycle     | Users can register with email/password, log in, refresh JWT tokens, and log out securely. Passwords hashed using bcrypt/argon2.                                                                                               |
| **FR-02** | Authorization & RBAC        | Strict resource isolation across roles        | Enforce 3 roles: `CUSTOMER`, `MERCHANT`, `ADMIN`. No user can access or modify another user's cart, mandate, address, or orders. Merchants only access their own inventory/orders.                                            |
| **FR-03** | Catalog Management          | Active vegetarian product catalog             | Seeded with vegetarian items, categories, pricing, unit quantities, and aliases. Customers can search by name, category, or alias.                                                                                            |
| **FR-04** | Product & Recipe Resolution | Natural language recipe mapping to SKUs       | Maps culinary recipes/ingredients to actual catalog SKUs and calculates required pack sizes. Identifies missing or ambiguous ingredients explicitly.                                                                          |
| **FR-05** | Cart Management             | Customer shopping cart with versioning        | Customers and authorized AI tools can add, update quantity, and remove items. Cart maintains an integer `version` incremented on every mutation.                                                                              |
| **FR-06** | Authoritative Pricing       | Pure server-side integer paise calculation    | Total, subtotal, and tax/fees computed strictly by backend in integer paise (`₹1.00 = 100 paise`). Frontend-supplied totals are rejected/ignored.                                                                             |
| **FR-07** | Inventory Reservation       | Concurrency-safe ephemeral reservations       | Prevents overselling via atomic stock reservations with a 15-minute TTL. Stock is auto-released if payment is not completed before expiry.                                                                                    |
| **FR-08** | Spending Mandates           | Customer-defined purchase policies            | Customers can set per-transaction budget limits, daily spending quotas, approved merchant lists, and blocked categories.                                                                                                      |
| **FR-09** | Deterministic Policy Engine | Isolated evaluation of proposed purchases     | Evaluates cart and mandate state to return one of three deterministic outcomes: `ALLOW`, `NEEDS_HUMAN_APPROVAL`, or `DENY`.                                                                                                   |
| **FR-10** | Human Approval Protocol     | Purchase-specific cryptographic approval      | Approvals are bound to a composite hash of `(userId, cartId, cartVersion, calculatedTotalPaise, mandateVersion)`. Any cart modification invalidates pending/granted approval.                                                 |
| **FR-11** | Checkout Orchestration      | Atomic pre-checkout revalidation              | Re-verifies cart contents, authoritative price, stock availability, policy compliance, and approval status before creating a payment order.                                                                                   |
| **FR-12** | Payment Integration         | Razorpay test mode & signature verification   | Orders generate a Razorpay order in test mode. Payment completion is verified strictly via cryptographic HMAC-SHA256 signature and idempotent webhook handling.                                                               |
| **FR-13** | Order Lifecycle & Snapshots | Immutable purchase record & state transitions | Creating an order stores an immutable snapshot of products, unit prices, delivery address, and mandate version. Follows strict state machine transitions.                                                                     |
| **FR-14** | AI Agent Tool Sandbox       | Allowlisted, schema-validated tool calling    | LLM can only execute approved tools (`searchCatalog`, `resolveRecipe`, `getCart`, `proposeCartItems`). All inputs validated by Zod schemas. AI cannot call checkout or payment APIs.                                          |
| **FR-15** | Tamper-Evident Audit Trail  | SHA-256 hash-chained event ledger             | Every security decision, policy outcome, approval, payment verification, and order transition is logged with a cryptographic link `Hash_n = SHA256(Hash_{n-1} + EventData)`. Verification endpoint validates chain integrity. |
| **FR-16** | Delivery Simulation         | Demonstrable order fulfillment lifecycle      | Background worker or demo triggers advance confirmed orders through `CONFIRMED` → `PACKING` → `OUT_FOR_DELIVERY` → `DELIVERED`.                                                                                               |
| **FR-17** | System Evaluation Suite     | Repeatable automated test benchmarks          | Automated scenario harness testing normal requests, ambiguous products, out-of-stock handling, budget violations, prompt injections, stale approvals, and replay attacks.                                                     |
| **FR-18** | Operational Readiness       | Health, readiness, and structured logs        | System exposes `/api/v1/health` (liveness) and `/api/v1/ready` (MongoDB & service dependencies check). Logs are structured JSON with sanitized secrets.                                                                       |

---

## Detailed Requirement Specifications

### FR-01: Account Management

- **Registration:** Accepts `email`, `password`, `name`, `role` (defaults to `CUSTOMER`). Validates password strength (min 8 chars, mixed case, numbers).
- **Authentication:** Issues short-lived access JWT (15 mins) and rotating refresh token (7 days) stored in HttpOnly, SameSite cookies.
- **Revocation:** Logout invalidates the active refresh token family.

### FR-02: Authorization & RBAC

- Middleware checks user role against required endpoint permissions.
- Object-level ownership check: `resource.userId === req.user.id`.
- Merchant users cannot view or edit items belonging to other `merchantId` entities.

### FR-03: Catalog Management

- Products contain: `id`, `merchantId`, `name`, `category`, `description`, `pricePaise`, `packageSize`, `packageUnit` (`G`, `KG`, `ML`, `L`, `PIECE`), `stockQuantity`, `aliases` (e.g., `["paneer", "cottage cheese", "fresh chenna"]`), `isVegetarian: true`, `isActive: true`.

### FR-04: Product & Recipe Resolution

- User input: Recipe title or ingredients list (e.g., "Vegetarian Biryani for 4").
- Output: Structured resolution list containing:
  - `matchedItems`: Array of `{ ingredientName, matchedProductId, requiredQuantity, packCount, unitPricePaise, subtotalPaise }`.
  - `ambiguousItems`: Ingredients with multiple close matches requiring user disambiguation.
  - `missingItems`: Ingredients unavailable in catalog.

### FR-05 & FR-06: Cart & Authoritative Pricing

- Cart schema tracks items `{ productId, quantity }` and `version: number`.
- `calculateCartPrice(cartId)`:
  - Fetches fresh product prices from DB.
  - `subtotalPaise = sum(product.pricePaise * item.quantity)`
  - `deliveryFeePaise = subtotalPaise > 50000 ? 0 : 4000` (free delivery above ₹500, else ₹40).
  - `taxPaise = round(subtotalPaise * 0.05)` (5% GST).
  - `totalPaise = subtotalPaise + deliveryFeePaise + taxPaise`.
  - Client-submitted totals are ignored; calculated total is authoritative.

### FR-07: Inventory Reservation

- When checkout starts, backend creates a `StockReservation`:
  - `status: "ACTIVE" | "RELEASED" | "CONSUMED"`
  - `expiresAt: now + 15 minutes`
  - Atomic decrement of available stock using MongoDB `$inc: { availableStock: -qty }` with query `{ availableStock: { $gte: qty } }`.
- Background job runs every 60 seconds to release expired reservations and return stock.

### FR-08 & FR-09: Mandates & Policy Decision Engine

- Mandate config: `maxOrderAmountPaise`, `dailyBudgetPaise`, `allowedMerchantIds`, `blockedCategories`.
- Decision engine input: `(cart, calculatedPricePaise, mandate, todaySpentPaise)`.
- Outcomes:
  - `DENY`: Cart total exceeds hard limit, contains blocked category, or violates merchant restriction.
  - `NEEDS_HUMAN_APPROVAL`: Total requires explicit confirmation per mandate threshold.
  - `ALLOW`: Purchase falls safely within auto-approval limits.

### FR-10: Human Approval Protocol

- Created when decision is `NEEDS_HUMAN_APPROVAL`.
- Stores fingerprint: `hash = SHA256(userId + cartId + cartVersion + totalPaise + mandateVersion)`.
- Approval modal in UI displays exact items, quantities, and price breakdown.
- If customer adds/removes items or modifies quantities, `cartVersion` increments and the pending approval is marked `INVALIDATED`.

### FR-11 & FR-12: Checkout & Payment Verification

- Checkout creates Razorpay test order: `amount = totalPaise`, `currency = "INR"`, `receipt = orderId`.
- Razorpay Checkout modal handles user interaction in test mode.
- Server verification endpoint receives: `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`.
- Server computes: `HMAC_SHA256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET)` and verifies constant-time equality.
- Webhook endpoint `/api/v1/webhooks/razorpay` verifies signature from raw request body and executes idempotent transitions.

### FR-13: Order Lifecycle & Snapshots

- On payment confirmation, Order document is created with immutable embedded snapshots:
  - `items`: Copy of all product metadata, quantities, and prices at purchase moment.
  - `pricingSnapshot`: Snapshot of subtotal, tax, delivery fee, total.
  - `shippingAddressSnapshot`: Full address snapshot.
  - `approvalSnapshot`: Approval ID and hash link.
- State transitions: `PENDING_PAYMENT` → `PAID` → `CONFIRMED` → `PACKING` → `OUT_FOR_DELIVERY` → `DELIVERED`. Terminal failure states: `FAILED`, `CANCELLED`, `REFUNDED`.

### FR-14: AI Agent Tool Sandbox

- Available tools:
  - `searchCatalog({ query, category, limit })`
  - `getProductDetails({ productId })`
  - `resolveRecipe({ dishName, servings })`
  - `getCart()`
  - `proposeCartItems({ items: [{ productId, quantity }] })`
- Execution limits: Max 5 tool steps per turn, 15-second total timeout, strict Zod schema validation on tool input/output.
- AI Agent cannot initiate checkouts, approve purchases, or edit prices.

### FR-15: Tamper-Evident Audit Trail

- Event structure: `{ sequenceNumber, timestamp, eventType, actorId, actorRole, resourceId, resourceType, payloadHash, previousHash, currentHash }`.
- `currentHash = SHA256(sequenceNumber + timestamp + eventType + actorId + payloadHash + previousHash)`.
- Genesis event has `previousHash = "0000000000000000000000000000000000000000000000000000000000000000"`.
- Admin verification endpoint iterates from genesis, re-computing digests to confirm zero tampering.

### FR-16: Delivery Simulator

- Demo driver can advance order state sequentially with realistic delays or on-demand manual triggers.
- Logs state update in audit log.

### FR-17: System Evaluation Suite

- Suite of 20+ automated scenarios:
  - Standard recipe request (e.g. Paneer Pulao)
  - Ambiguous recipe query
  - Out of stock item
  - Mandate threshold exceeded
  - Unauthorized merchant item
  - Prompt injection attempting price override
  - Cart modification post-approval
  - Webhook replay attempt
  - Corrupted audit event detection

### FR-18: Operational Readiness

- `/api/v1/health`: Checks process uptime and responsiveness.
- `/api/v1/ready`: Pings MongoDB connection and critical service handles.
- Error responses adhere to RFC 7807 problem details format.
