# CartPilot — Architecture Decision Records (ADRs)

This document formalizes the key architectural decisions governing CartPilot, documenting the context, alternatives considered, chosen approach, rationale, and consequences.

---

## ADR Index

- [ADR-001: Architectural Style — Modular Monolith](#adr-001-architectural-style--modular-monolith)
- [ADR-002: Frontend Stack — React, Vite, TypeScript, Tailwind CSS](#adr-002-frontend-stack--react-vite-typescript-tailwind-css)
- [ADR-003: Backend Stack — Node.js, Express, TypeScript](#adr-003-backend-stack--nodejs-express-typescript)
- [ADR-004: Persistence Engine — MongoDB Atlas with Mongoose](#adr-004-persistence-engine--mongodb-atlas-with-mongoose)
- [ADR-005: Currency & Monetary Representation — Integer Paise](#adr-005-currency--monetary-representation--integer-paise)
- [ADR-006: AI Integration & Tool Execution Sandbox](#adr-006-ai-integration--tool-execution-sandbox)
- [ADR-007: Deterministic Policy Enforcement Outside the LLM](#adr-007-deterministic-policy-enforcement-outside-the-llm)
- [ADR-008: Payment Gateway — Razorpay Test Mode with Server Verification](#adr-008-payment-gateway--razorpay-test-mode-with-server-verification)
- [ADR-009: Ephemeral Inventory Reservations with TTL Expiry](#adr-009-ephemeral-inventory-reservations-with-ttl-expiry)
- [ADR-010: Cryptographic Audit Trail — SHA-256 Hash Chaining](#adr-010-cryptographic-audit-trail--sha-256-hash-chaining)
- [ADR-011: Delivery Lifecycle — Simulated State Machine](#adr-011-delivery-lifecycle--simulated-state-machine)
- [ADR-012: Background Task Orchestration — In-Process Scheduled Jobs](#adr-012-background-task-orchestration--in-process-scheduled-jobs)

---

## ADR-001: Architectural Style — Modular Monolith

- **Status:** Accepted
- **Context:** We require clear domain boundaries, rapid development cycles, and high transactional reliability across inventory, payment, and order states.
- **Alternatives Considered:** Microservices, Serverless Functions, Monolithic Spaghetti.
- **Decision:** Build a Modular Monolith in TypeScript with isolated feature modules (`modules/*`), explicit exported services, and strict dependency rules.
- **Rationale:** Microservices introduce distributed transactions, network latency, and operational overhead unnecessary for the project's scope. A modular monolith enforces identical domain boundaries with zero distributed systems tax.
- **Consequences:** Modules can be extracted into standalone services later if necessary without changing domain logic.

---

## ADR-002: Frontend Stack — React, Vite, TypeScript, Tailwind CSS

- **Status:** Accepted
- **Context:** Need an interactive, responsive UI supporting conversational chat, real-time cart review, policy notifications, and payment modals.
- **Alternatives Considered:** Next.js, Vue/Nuxt, Plain HTML/JavaScript.
- **Decision:** React 18+ with Vite, TypeScript, and Tailwind CSS.
- **Rationale:** Vite provides rapid build and HMR times; React provides rich component ecosystems for modals and chat streaming; TypeScript ensures end-to-end type safety aligned with backend DTOs.
- **Consequences:** Client-side routing with clear separation between presentation and backend data fetching.

---

## ADR-003: Backend Stack — Node.js, Express, TypeScript

- **Status:** Accepted
- **Context:** The commerce backend requires fast asynchronous I/O, rich validation ecosystems, and seamless integration with payment SDKs and LLM APIs.
- **Alternatives Considered:** Python (FastAPI), Go, Java (Spring Boot).
- **Decision:** Node.js with Express and TypeScript (`strict: true`).
- **Rationale:** Using TypeScript across both frontend and backend enables shared schema definitions (Zod/TypeScript DTOs), eliminates cross-language mental context switches, and allows rapid prototyping of modular commerce services.
- **Consequences:** All developers write TypeScript; team does not need to maintain a separate Python runtime.

---

## ADR-004: Persistence Engine — MongoDB Atlas with Mongoose

- **Status:** Accepted
- **Context:** The application manages hierarchical grocery catalogs with aliases, flexible recipe structures, chat histories, and frozen order snapshots.
- **Alternatives Considered:** PostgreSQL, MySQL, DynamoDB.
- **Decision:** MongoDB Atlas with Mongoose ODM.
- **Rationale:** Document modeling allows freezing immutable order snapshots (saving products, prices, and address directly inside the order document) without multi-table join migrations. Text indexing natively supports catalog alias lookups.
- **Consequences:** The application layer must enforce referential consistency and tenant isolation rather than relying solely on foreign key constraints.

---

## ADR-005: Currency & Monetary Representation — Integer Paise

- **Status:** Accepted
- **Context:** Floating-point representations (e.g., `0.1 + 0.2 = 0.30000000000000004`) lead to cumulative rounding errors, discrepancy with payment gateways, and security vulnerabilities.
- **Alternatives Considered:** Standard IEEE-754 floats, Decimal/BigDecimal string libraries.
- **Decision:** Store and compute all monetary values as positive 64-bit integers in paise (`₹1.00 = 100 paise`).
- **Rationale:** Eliminates floating-point rounding errors natively; matches Razorpay's native API convention (which requires amounts in paise).
- **Consequences:** UI formatting converts paise to rupees only at the presentation layer (`(paise / 100).toFixed(2)`).

---

## ADR-006: AI Integration & Tool Execution Sandbox

- **Status:** Accepted
- **Context:** The AI agent must assist users in product and recipe discovery without being granted direct authority to mutate records or execute financial transactions.
- **Alternatives Considered:** Direct database access for the LLM, Unrestricted code interpreter, Agent-driven checkout.
- **Decision:** Provider-agnostic LLM adapter with schema-bounded tool calling. Tools are strictly allowlisted and validated with Zod. The LLM can only search and propose.
- **Rationale:** Keeps the untrusted probabilistic LLM strictly separated from the trusted deterministic commerce core.
- **Consequences:** Any tool failure is caught gracefully; agent cannot execute checkout or bypass payment rules.

---

## ADR-007: Deterministic Policy Enforcement Outside the LLM

- **Status:** Accepted
- **Context:** Users set spending limits, merchant restrictions, and category blocks. LLMs cannot be trusted to enforce numerical rules reliably due to prompt injection and hallucination.
- **Alternatives Considered:** LLM system prompt instructions (e.g. "Never spend more than ₹600").
- **Decision:** Isolated deterministic TypeScript policy engine evaluates cart totals and returns `ALLOW`, `NEEDS_HUMAN_APPROVAL`, or `DENY`.
- **Rationale:** Mandate enforcement is a critical financial control and must be 100% deterministic and testable with unit tests.
- **Consequences:** The LLM's opinion is completely bypassed during policy decision-making.

---

## ADR-008: Payment Gateway — Razorpay Test Mode with Server Verification

- **Status:** Accepted
- **Context:** The application needs a demonstrable checkout flow without processing live real-money banking transactions.
- **Alternatives Considered:** Mock internal payment toggle, Stripe, Live Razorpay.
- **Decision:** Razorpay Test Mode with server-side HMAC-SHA256 signature verification and webhook idempotency.
- **Rationale:** Provides realistic checkout UX (UPI, card modals) while remaining safe and compliant in test mode; exercises real cryptographic signature verification.
- **Consequences:** Requires Razorpay test keys in environment configuration.

---

## ADR-009: Ephemeral Inventory Reservations with TTL Expiry

- **Status:** Accepted
- **Context:** In concurrent shopping environments, items can be oversold if stock is not reserved during checkout. Long-held uncompleted checkouts lock up inventory indefinitely.
- **Alternatives Considered:** Deduct stock only upon payment; Permanent reservation without timeout.
- **Decision:** Reserve stock atomically upon checkout initiation with a 15-minute TTL. An in-process sweeper job releases expired reservations.
- **Rationale:** Prevents double-selling while guaranteeing stock returns to the pool if the customer abandons the payment window.
- **Consequences:** Checkouts must be completed within 15 minutes of initiation.

---

## ADR-010: Cryptographic Audit Trail — SHA-256 Hash Chaining

- **Status:** Accepted
- **Context:** Regulatory, audit, and security requirements dictate that consequential decisions (proposals, policy decisions, approvals, payments) cannot be repudiated or tampered with silently.
- **Alternatives Considered:** Plain database logs, Third-party blockchain / QLDB.
- **Decision:** Append-only MongoDB collection `audit_events` with SHA-256 rolling hash chain:
  `Hash_n = SHA256(seq + timestamp + type + actorId + payloadHash + Hash_{n-1})`.
- **Rationale:** Detects any retroactive record deletion, modification, or reordering without external blockchain cost.
- **Consequences:** Exposes an admin verification route `/api/v1/audit/verify` that verifies the chain mathematically.

---

## ADR-011: Delivery Lifecycle — Simulated State Machine

- **Status:** Accepted
- **Context:** Real-world logistics integration (Dunzo, Shiprocket) is out-of-scope for the MVP, but realistic post-purchase order tracking must be demonstrable.
- **Alternatives Considered:** Instant transition to DELIVERED; Real courier API integration.
- **Decision:** A deterministic simulated state machine (`CONFIRMED` → `PACKING` → `OUT_FOR_DELIVERY` → `DELIVERED`) triggered either by demo test buttons or a background job.
- **Rationale:** Demonstrates fulfillment flow, state transitions, and audit logging cleanly without third-party logistics dependencies.
- **Consequences:** Orders realistically progress through order statuses during live demonstration.

---

## ADR-012: Background Task Orchestration — In-Process Scheduled Jobs

- **Status:** Accepted
- **Context:** Periodic tasks (reservation expiry cleanup, delivery simulation) need to execute reliably in the MVP without introducing external Redis/BullMQ infrastructure.
- **Alternatives Considered:** Redis + BullMQ, AWS SQS / EventBridge, In-Process timers (`setInterval`).
- **Decision:** In-process scheduled jobs using Node.js timers wrapped with concurrency locks and graceful shutdown handlers.
- **Rationale:** Zero external infrastructure dependencies for MVP local development and evaluation.
- **Consequences:** Can be transparently swapped for BullMQ/Redis when horizontal scaling is introduced post-MVP.
