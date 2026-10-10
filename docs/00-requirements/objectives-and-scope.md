# CartPilot — Objectives, Vision, Actors & Scope Freeze

## 1. Product Vision

A user should be able to provide high-level shopping intent:

> _“Prepare a grocery cart for vegetarian paneer pulao for four people. Keep it below ₹600, use only my approved merchant, and ask me before placing the order.”_

### The End-to-End System Journey

1. **Understand Intent:** The agent parses the recipe name, serving size (4 persons), price cap (₹600 / 60,000 paise), merchant constraint, and approval requirement.
2. **Catalog-Grounded Resolution:** The system maps culinary ingredients (basmati rice, paneer, green peas, spices, ghee) to real merchant catalog items, resolving aliases, pack sizes, and missing/ambiguous items.
3. **Structured Proposal:** The agent presents itemized quantities, unit pack sizes, and prices.
4. **Authoritative Backend Pricing:** The pricing service calculates the true total in integer paise directly from database product records, ignoring any price assertions from the frontend or LLM.
5. **Stock & Policy Evaluation:** Backend validates active inventory and evaluates user mandates (budget, merchant allowlist, categories).
6. **Explicit Human Approval:** If mandates require human confirmation (or spending exceeds auto-approve threshold), an approval ticket is created bound strictly to the exact cart items, total, and mandate version.
7. **Safe Checkout Initiation:** Only upon valid approval does the checkout service atomically reserve stock and request a payment order from the payment gateway.
8. **Server-Side Payment Verification:** The gateway checkout is completed by the customer in test mode; the backend verifies the cryptographic HMAC signature before transitioning the order to `PAID`.
9. **Simulated Delivery:** The order moves through a simulated fulfillment lifecycle (`CONFIRMED` → `PACKED` → `OUT_FOR_DELIVERY` → `DELIVERED`).
10. **Tamper-Evident Audit Logging:** Every consequential action (proposal, policy check, human approval, reservation, payment verification, delivery state update) is recorded in an immutable hash chain.

---

## 2. Core Objectives

| Objective ID | Name                                 | Description                                                                                                                                                |
| :----------- | :----------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **O1**       | **Natural-Language Shopping**        | Provide a conversational shopping interface that translates free-form natural language into structured commerce operations.                                |
| **O2**       | **Catalog-Grounded Resolution**      | Map recipe ingredients and aliases to real catalog products, pack sizes, and quantities, explicitly flagging ambiguity or unavailable items.               |
| **O3**       | **Deterministic Policy Enforcement** | Enforce spending limits, daily allowances, merchant restrictions, and category controls via an isolated, deterministic backend rule engine.                |
| **O4**       | **Controlled Authorization**         | Require cryptographic, purchase-specific human approval whenever mandated by rules, invalidating approvals immediately upon cart alteration.               |
| **O5**       | **Payment Integrity**                | Guarantee that payment status transitions occur strictly through server-side cryptographic signature verification and idempotent webhook handling.         |
| **O6**       | **Inventory Integrity**              | Guarantee stock consistency under concurrent requests using atomic reservations with automatic TTL expiration to prevent overselling.                      |
| **O7**       | **Accountability & Audit**           | Record all security, policy, and financial events in a SHA-256 hash-chained log with a verifiable proof endpoint.                                          |
| **O8**       | **Measurable Evaluation**            | Benchmark the platform against a suite of adversarial test scenarios (prompt injection, price tampering, stock racing, replay attacks, policy edge cases). |

---

## 3. Actors and Responsibilities

| Actor                          | Type                 | Allowed Responsibilities                                                                                                            | Forbidden Actions                                                                                                                |
| :----------------------------- | :------------------- | :---------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| **Customer**                   | End-User (Human)     | Browse catalog, chat with agent, manage cart, configure spending mandates, review/approve purchases, complete payment, view orders. | Cannot alter prices, cannot access other customers' data, cannot bypass spending policy.                                         |
| **Merchant**                   | Partner (Human)      | Manage authorized merchant catalog, update prices, manage stock, view merchant-scoped orders.                                       | Cannot modify other merchants' products, cannot view global customer profiles or cross-merchant analytics.                       |
| **Administrator**              | Operator (Human)     | Inspect system health, manage users/merchants, inspect and verify audit logs, trigger reconciliation jobs.                          | Cannot bypass signature verification, cannot alter historical audit hash chains.                                                 |
| **AI Agent**                   | Unprivileged Service | Interpret queries, search catalog via schema-bounded tools, propose cart items, answer product inquiries.                           | **CANNOT** execute purchases, cannot override policy decisions, cannot set prices, cannot alter stock, cannot grant permissions. |
| **Backend Commerce Services**  | Trusted System       | Authoritative pricing, inventory reservation, mandate evaluation, approval validation, order snapshots, payment coordination.       | Cannot accept client-declared prices or untrusted gateway statuses.                                                              |
| **Payment Gateway (Razorpay)** | External Partner     | Host secure payment modal in test mode, return signature tokens, dispatch webhook events.                                           | Trusted only via cryptographic webhook signature verification and server-to-server validation.                                   |
| **Delivery Simulator**         | Background Worker    | Advance order fulfillment states in demonstration mode along realistic state transitions.                                           | Cannot alter financial records or completed payments.                                                                            |
| **Audit Service**              | Trusted Core         | Append events to hash chain, compute rolling SHA-256 digests, verify chain integrity.                                               | Append-only; strictly forbidden from updating or deleting historical entries.                                                    |

> **Crucial Rule:** The AI Agent is **NOT** a privileged actor. It has zero authority to bypass policy, alter prices, confirm payments, or execute database writes outside narrow tool-call boundaries.

---

## 4. Scope Freeze

### In-Scope (MVP Deliverables)

- **Identity & Access Management:** User registration, login, logout, refresh tokens, role-based access control (Customer, Merchant, Admin).
- **Seeded Catalog:** Curated vegetarian grocery dataset (pulses, grains, dairy/paneer, spices, vegetables, condiments) with product aliases.
- **Product Discovery:** Full-text catalog search, category filtering, merchant-specific views.
- **Recipe-to-Cart Engine:** Mapping dishes and ingredient lists to specific merchant SKUs and minimum required pack counts.
- **Authoritative Cart & Pricing:** Server-side calculation stored in integer paise; client totals strictly advisory.
- **Inventory Reservation System:** Ephemeral reservations with automated TTL expiry to protect against stock depletion races.
- **Spending Policy & Mandate Engine:** Per-transaction caps, daily spend quotas, approved merchant lists, category blocks.
- **Approval Lifecycle:** Purchase-specific approval tokens bound to cart hash, price, and mandate version; auto-invalidated on change.
- **Controlled LLM Tool Execution:** Schema-bounded tool calling with Zod validation, bounded iteration count, and timeout limits.
- **Test-Mode Payment Orchestration:** Razorpay test-mode order generation, client checkout handler, server-side HMAC signature verification, and idempotent webhook handler.
- **Order Management:** Immutable snapshot of products, quantities, prices, and address at time of confirmation; formal state transitions.
- **Simulated Order Fulfillment:** State machine advancement (`CONFIRMED` → `PACKED` → `OUT_FOR_DELIVERY` → `DELIVERED`).
- **Cryptographic Audit Trail:** Append-only event store with SHA-256 hash chaining and automated verification route.
- **Evaluation Suite:** Deterministic benchmark suite validating security boundaries, policy enforcement, and tool isolation.

### Explicitly Out-of-Scope (Deferred Post-MVP)

- Live production banking/UPI payment processing.
- Real-world courier integration (e.g., Shiprocket, Dunzo) or real-time GPS fleet tracking.
- Custom LLM fine-tuning or training (commodity foundation models via API are used).
- Standalone Python AI microservices (LLM orchestration runs inside the modular backend).
- Microservices, service meshes, or Kubernetes cluster orchestrations.
- Vector database infrastructure or vector embedding pipelines (catalog search leverages indexed full-text search).
- Model Context Protocol (MCP) standalone daemons.
- Autonomous payments executing without explicit user approval when rules require confirmation.
- Advanced multi-tenant merchant invoicing, settlement ledgers, and BI dashboards.
