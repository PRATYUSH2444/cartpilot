# CartPilot — Non-Functional Requirements Specification

This document defines the quality attributes, security boundaries, performance expectations, and operational constraints for CartPilot (NFR-01 through NFR-10).

---

## Non-Functional Requirements Matrix

| ID         | Category                     | Summary Requirement                                                                 | Target Verification Method                                                                                           |
| :--------- | :--------------------------- | :---------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **NFR-01** | **Security**                 | Zero-trust backend enforcement, strict input validation, cryptographic verification | Automated security regression test suite (prompt injection, cross-tenant access, signature spoofing).                |
| **NFR-02** | **Data Integrity**           | Complete monetary precision and immutable historical snapshots                      | Integer paise currency throughout (`1 INR = 100 paise`). Order snapshots freeze product details and prices.          |
| **NFR-03** | **Concurrency**              | Race-condition prevention under simultaneous requests                               | Concurrency stress tests checking stock reservations and daily budget caps using atomic MongoDB updates.             |
| **NFR-04** | **Idempotency**              | Duplicate requests or webhook retries must not duplicate side-effects               | Idempotency key tracking on checkout and unique event indexing on webhook transaction logs.                          |
| **NFR-05** | **Reliability & Resilience** | Controlled degradation when external providers (LLM, Gateway) fail                  | Circuit breakers and fallbacks: LLM timeout defaults to structured catalog search; webhook retries supported.        |
| **NFR-06** | **Maintainability**          | Clean modular monolith with strict domain boundaries                                | Feature-module organization in TypeScript; zero circular module dependencies; explicit interfaces.                   |
| **NFR-07** | **Testability**              | Deterministic business rules isolated from third-party networks                     | Unit test coverage for pricing, policy rules, and hash chaining without requiring live DB or external APIs.          |
| **NFR-08** | **Usability**                | Clear visual hierarchy, informative feedback, and explicit human confirmation       | Mobile-responsive design with explicit cart review, price breakdown, and confirmation modals.                        |
| **NFR-09** | **Observability**            | Structured logging, request correlation, and safe diagnostics                       | Structured JSON logs with `requestId`, sanitized secrets, health checks (`/health`, `/ready`).                       |
| **NFR-10** | **Privacy & Compliance**     | Data minimization and safe credential handling                                      | Only necessary checkout data retained; secrets stored strictly in environment variables; zero PII in audit payloads. |

---

## Detailed Specifications

### NFR-01: Security

1. **Zero-Trust AI Principle:** Treat all LLM output and frontend input as unauthenticated, untrusted suggestions. The backend must independently validate every product ID, quantity, price, and permission.
2. **Authentication & Session Security:**
   - Password hashing with `bcrypt` (work factor 12) or `argon2id`.
   - Access tokens (JWT) expire within 15 minutes.
   - Refresh tokens stored in `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
3. **Authorization & Tenant Isolation:** Every request handler must enforce ownership checks (`resource.userId === currentUser.id`). Merchants are scoped strictly to their `merchantId`.
4. **Injection Mitigation:**
   - LLM tools receive only structured, schema-validated parameters.
   - Catalog descriptions are escaped and treated as untrusted text to prevent prompt injection.
5. **Cryptographic Signatures:** Razorpay payment callbacks must be verified using HMAC-SHA256 signatures before any state transition.

### NFR-02: Data Integrity

1. **Monetary Representation:**
   - All prices, subtotals, taxes, delivery fees, and limits must be stored and computed as non-negative integers in paise (`₹1 = 100 paise`).
   - Floating-point representations (`float`, `double`) are strictly prohibited in database schemas and business calculations.
2. **Order Immutability:**
   - Once an order is created, its items, prices, shipping address, and applied mandate must be stored as embedded document snapshots.
   - Subsequent changes to catalog products (price increase, renaming, deletion) must have zero effect on historical orders.

### NFR-03: Concurrency Safety

1. **Stock Depletion Racing:**
   - Stock reservation operations must use atomic conditions:
     ```javascript
     findOneAndUpdate(
       { _id: productId, availableStock: { $gte: requestedQty } },
       { $inc: { availableStock: -requestedQty } },
       { new: true }
     );
     ```
   - If available stock is insufficient, the operation fails cleanly without partial decrements.
2. **Budget Enforcement Racing:**
   - When multiple orders are submitted concurrently for a user, the spending engine must account for active reservations and pending checkouts against the daily budget.

### NFR-04: Idempotency

1. **Payment Webhook Processing:**
   - Webhook events have a unique `event_id` or `payment_id`.
   - A dedicated `processed_events` table ensures each webhook event is processed exactly once:
     ```typescript
     await ProcessedEventModel.create({ eventId, processedAt: new Date() });
     // Duplicate attempts throw unique key error and return 200 OK without re-running order logic
     ```
2. **Checkout Idempotency:**
   - Checkout requests include an `Idempotency-Key` header, preventing duplicate payment order generation upon double-clicks or network retries.

### NFR-05: Reliability & Resilience

1. **LLM Provider Timeouts:**
   - All LLM API calls are bounded by a 15-second timeout.
   - If the LLM provider fails, times out, or returns invalid JSON, the system gracefully falls back to structured catalog search or notifies the user with actionable errors.
2. **Payment Failure Recovery:**
   - If a payment attempt fails or is abandoned by the user, the associated stock reservation expires after 15 minutes, returning inventory to the available pool.

### NFR-06: Maintainability

1. **Modular Architecture:**
   - Strict feature-oriented module layout (`modules/auth`, `modules/catalog`, `modules/pricing`, `modules/orders`, etc.).
   - No cross-module database model mutations; modules communicate via defined exported services.
2. **Strict Typing:**
   - 100% TypeScript coverage with `strict: true`. No usage of untyped `any` in business modules.

### NFR-07: Testability

1. **Unit Test Decoupling:**
   - Pure functions for pricing, policy rules, and hash chain computation must run without database, network, or third-party dependencies.
2. **Deterministic Seed Data:**
   - Predictable test fixture dataset for products, recipes, users, and mandates to enable reproducible automated tests.

### NFR-08: Usability

1. **Transparency & Confirmation:**
   - The user must always see exact product names, pack sizes, individual prices, and delivery charges before confirming an order.
   - If an ingredient in a recipe request cannot be fulfilled, the UI must highlight it clearly.
2. **Responsive Feedback:**
   - Cart modifications, policy evaluation results, and approval states must display clear visual loading, error, and success indicators.

### NFR-09: Observability

1. **Structured Logging:**
   - All logs formatted in structured JSON containing `timestamp`, `level`, `requestId`, `userId`, `module`, and `message`.
   - Sensitive fields (`password`, `token`, `secret`, `signature`, `cardNumber`) are scrubbed before writing logs.
2. **Health Diagnostics:**
   - `/api/v1/health` returns status `UP` for process liveness.
   - `/api/v1/ready` checks active connectivity to MongoDB Atlas and downstream dependencies.

### NFR-10: Privacy & Data Minimization

1. **Information Retention:**
   - Collect only data necessary for order placement: email, name, delivery address.
   - No storage of raw credit card, CVV, or banking credentials (delegated entirely to Razorpay).
2. **Audit Privacy:**
   - Audit event payloads store entity IDs, state transitions, and SHA-256 hashes of payloads rather than unencrypted personal addresses or credentials.
