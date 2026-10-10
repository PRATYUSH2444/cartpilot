# CartPilot — Backend Module Boundaries & Ownership

This document defines the backend modular structure, directory organization, domain boundaries, ownership contracts, and inter-module communication rules.

---

## 1. Directory Structure

The backend application follows a domain-driven, feature-modular structure:

```
apps/api/src/
├── app.ts                          # Express application setup, middleware registration
├── server.ts                       # HTTP listener startup, graceful shutdown
├── config/                         # Environment config validation (Zod)
│   ├── env.config.ts
│   └── constants.ts
├── common/                         # Shared infrastructural primitives
│   ├── errors/                     # AppError, NotFoundError, ForbiddenError, ValidationError
│   ├── middleware/                 # authenticate, authorize, validateRequest, rateLimiter
│   ├── validation/                 # Zod validation helpers & common schemas
│   ├── logging/                    # Pino structured logger with redaction
│   └── utilities/                  # Money utils (paise math), hash utils
├── modules/                        # Domain feature modules
│   ├── auth/                       # Register, login, refresh, logout, token service
│   ├── users/                      # User profile management
│   ├── addresses/                  # Delivery address CRUD & ownership
│   ├── merchants/                  # Merchant profile & operational settings
│   ├── catalog/                    # Products, search, aliases, categories
│   ├── cart/                       # Cart state, item mutations, versioning
│   ├── pricing/                    # Authoritative pricing engine (integer paise)
│   ├── inventory/                  # Available stock, atomic reservations, TTL release
│   ├── mandates/                   # Spending rules, budget limits, merchant allowlists
│   ├── policy/                     # Deterministic evaluation engine (ALLOW/NEEDS_APPROVAL/DENY)
│   ├── approvals/                  # Purchase-specific cryptographic approval lifecycle
│   ├── recipe/                     # Recipe-to-SKU resolution engine
│   ├── agent/                      # LLM chat orchestrator, tool registry, execution sandbox
│   ├── checkout/                   # Pre-checkout revalidation, orchestrator
│   ├── orders/                     # Order snapshots, state machine, transitions
│   ├── payments/                   # Razorpay integration, HMAC verification, webhooks
│   ├── notifications/              # In-app event alerts
│   ├── audit/                      # SHA-256 hash-chained event ledger & verifier
│   └── health/                     # /health and /ready diagnostic routes
├── integrations/                   # External service client adapters
│   ├── llm/                        # LLM provider adapter (Gemini/OpenAI/Anthropic)
│   └── razorpay/                   # Razorpay SDK wrapper & signature validator
└── jobs/                           # Background scheduled workers
    ├── reservation-expiry.job.ts   # Sweeper releasing uncompleted reservations (60s)
    └── delivery-simulation.job.ts  # Demo fulfillment state advancer (30s)
```

---

## 2. Standard Module Blueprint

Each feature module is self-contained:

```
modules/catalog/
├── catalog.routes.ts       # Express router with route guards
├── catalog.controller.ts   # Request extraction, parameter passing, response shaping
├── catalog.service.ts      # Core business logic and database queries
├── catalog.schema.ts       # Zod schemas for request validation & tool parameters
├── catalog.model.ts        # Mongoose schema, document interfaces, and indexes
└── catalog.test.ts         # Unit & integration tests
```

---

## 3. Module Responsibility Matrix

| Module        | What It Owns                                                                                                   | What It MUST NOT Own                                                                    |
| :------------ | :------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| **Catalog**   | Product definitions, categories, prices, aliases, search indexing, merchant SKU associations.                  | Payment state, customer carts, discounts.                                               |
| **Pricing**   | Pure, authoritative price calculations (subtotal, delivery fee, GST/tax, discounts) in integer paise.          | UI display states, caching uncommitted client totals.                                   |
| **Cart**      | Active customer cart items, quantities, and sequential integer `version`.                                      | Granting checkout authorization, calculating final tax/delivery fees.                   |
| **Inventory** | Authoritative stock quantities, atomic reservations, reservation TTLs, release logic.                          | LLM reasoning, customer profile data, pricing logic.                                    |
| **Mandates**  | Customer spending rules, per-order limits, daily budgets, merchant allowlists, blocked categories.             | Modifying cart items or executing payment transactions.                                 |
| **Policy**    | Deterministic evaluation of `(cart, totalPaise, mandate)` yielding `ALLOW`, `NEEDS_HUMAN_APPROVAL`, or `DENY`. | Payment gateway calls, UI modal rendering.                                              |
| **Approvals** | Approval records, cryptographic binding hash, validity checks, invalidation on cart mutation.                  | Direct cart modifications, modifying product prices.                                    |
| **Agent**     | LLM prompt management, chat session history, schema-bounded tool calling, tool sandboxing.                     | **Bypassing business rules, confirming payments, executing checkout without approval.** |
| **Checkout**  | Atomic orchestration of pre-checkout checks (stock, mandate, approval, price), Razorpay order creation.        | Signature validation, order fulfillment progression.                                    |
| **Payments**  | Gateway order linkage, HMAC signature validation, webhook idempotency, payment attempt states.                 | Client-asserted payment success, inventory reservation logic.                           |
| **Orders**    | Immutable order snapshots (items, pricing, address, mandate), state machine transitions.                       | Processing unverified payments, altering past transactions.                             |
| **Audit**     | Append-only event store, SHA-256 rolling hash chain, tamper verification endpoint.                             | Editing or deleting business records, storing raw plaintext secrets.                    |
| **Health**    | Liveness probe (`/health`) and dependency readiness probe (`/ready`).                                          | Application business logic.                                                             |

---

## 4. Inter-Module Communication Rules

To preserve clean boundaries inside the modular monolith:

1. **No Cross-Module Database Model Access:**
   - A module must **never** import another module's Mongoose model directly.
   - _Example:_ The `checkout` module must call `inventoryService.reserveStock(...)`, never `ProductModel.findOneAndUpdate(...)` directly.
2. **Explicit Service APIs:**
   - Each module exports a typed service class or functions defining its public API contract.
3. **Strict Direction of Dependency:**
   - Low-level modules (`pricing`, `catalog`, `inventory`) must never depend on high-level orchestration modules (`checkout`, `agent`).
   - Circular imports between modules are strictly prohibited.
4. **Data Passing by Value:**
   - Modules exchange plain TypeScript DTOs, not raw Mongoose query documents, across module boundaries.
5. **Transactional Orchestration:**
   - Complex workflows requiring multi-document consistency (e.g., checkout confirming order and consuming reservation) are coordinated explicitly by the `checkout` service using MongoDB sessions or atomic state transitions.
