# CartPilot (Agent Commerce Gateway) — Documentation Suite

Welcome to the architectural and requirements documentation for **CartPilot (Agent Commerce Gateway)**.

> **Core Architectural Principle:**
> AI proposes → backend validates → policy engine decides → commerce service executes → audit service records.

---

## Documentation Index

### [Phase 00 — Project Definition & Requirements](./00-requirements/)

1. **[Problem Statement](./00-requirements/problem-statement.md)** — Project context, conversational AI risks, solution overview, and primary differentiator.
2. **[Objectives & Scope](./00-requirements/objectives-and-scope.md)** — Product vision, O1–O8 objectives, actors & responsibilities matrix, and scope freeze (MVP vs deferred).
3. **[Functional Requirements](./00-requirements/functional-requirements.md)** — Comprehensive specifications for FR-01 through FR-18.
4. **[Non-Functional Requirements](./00-requirements/non-functional-requirements.md)** — Quality attributes, security bounds, concurrency, precision, and observability standards (NFR-01 through NFR-10).
5. **[User Stories](./00-requirements/user-stories.md)** — Customer, Merchant, and Administrator user stories with motivations and business value.
6. **[Acceptance Criteria & Evaluation](./00-requirements/acceptance-criteria.md)** — Measurable acceptance criteria by user story, 20-scenario adversarial evaluation matrix, and Phase 00 sign-off checklist.

---

### [Phase 01 — System Design & Security Architecture](./01-architecture/)

1. **[System Architecture](./01-architecture/system-architecture.md)** — High-level modular monolith component diagram, request lifecycles, operating cycle, and trust zones.
2. **[Module Boundaries & Ownership](./01-architecture/module-boundaries.md)** — Backend directory structure (`apps/api/src/`), domain responsibility matrix, and cross-module communication rules.
3. **[Database Design & Schemas](./01-architecture/database-design.md)** — Entity-relationship diagram, Mongoose schemas, integer paise currency modeling, and indexing strategies.
4. **[API Boundary Design](./01-architecture/api-design.md)** — `/api/v1` route catalog, standard response envelopes, error conventions, and raw webhook handling.
5. **[Payment & State Machines](./01-architecture/payment-state-machine.md)** — Finite state machines for Payments, Orders, Approvals, and Reservations with transition invariants.
6. **[Security Threat Model](./01-architecture/threat-model.md)** — STRIDE analysis, 13 specific threat vectors, backend defensive controls, and verification protocols.
7. **[Architecture Decision Records](./01-architecture/architecture-decisions.md)** — Formal ADRs 001 through 012 recording all architectural choices and trade-offs.

---

## Phase Sign-Off Status

| Milestone    | Deliverables                                                                | Verification Status            |
| :----------- | :-------------------------------------------------------------------------- | :----------------------------- |
| **Phase 00** | Problem Statement, Scope, FRs, NFRs, Stories, Acceptance Criteria           | **100% Complete & Signed Off** |
| **Phase 01** | Architecture, Boundaries, Schemas, APIs, State Machines, Threat Model, ADRs | **100% Complete & Signed Off** |
| **Phase 02** | Development Environment & Repository Kickstart                              | **Ready to Begin**             |
