# CartPilot (Agent Commerce Gateway) — Problem Statement

## 1. Project Context

- **Project Title:** Agent Commerce Gateway
- **Demonstration Application:** CartPilot
- **Project Category:** Full-stack web application with controlled AI-agent integration
- **Primary Domain:** Vegetarian grocery shopping and order orchestration
- **Frontend Stack:** React, Vite, TypeScript, Tailwind CSS
- **Backend Stack:** Node.js, Express, TypeScript
- **Database:** MongoDB Atlas with Mongoose
- **Payment Gateway:** Razorpay (Test Mode)
- **AI Integration:** LLM tool calling with strict schema validation and bounded execution

---

## 2. Core Problem

Modern online commerce requires consumers to manually discover products, select matching units and pack sizes, compute basket totals, navigate payment gateways, and track fulfillment. While Conversational AI systems have shown great promise in simplifying discovery and natural-language understanding, granting AI agents direct autonomy over purchasing introduces fundamental risks:

1. **Incorrect Product Resolution:** AI models frequently hallucinate products, choose incorrect pack sizes or quantities, or select items not present in the merchant's active catalog.
2. **Unauthorized & Runaway Spending:** Without rigid deterministic boundaries, an AI agent could be prompted or drift into exceeding user budget allowances or making unauthorized bulk purchases.
3. **Stale Prices & Ghost Inventory:** LLMs rely on latent or cached context; prices fluctuate and inventory depletes in real-time. Committing an order based on LLM-estimated prices causes price discrepancies and checkout failures.
4. **Prompt Injection & Tool Abuse:** Malicious actors or adversarial text embedded in product listings can manipulate LLMs into calling internal tools with attacker-chosen parameters.
5. **Duplicate Transactions & Inconsistent State:** Retries, network timeouts, or non-idempotent payment triggers can charge users multiple times or transition orders into invalid states.
6. **Lack of Verifiable Accountability:** When AI assists or executes transactions, establishing who authorized what, at what exact price, and under what policy becomes legally and operationally critical.

---

## 3. The Proposed Solution

**Agent Commerce Gateway (CartPilot)** solves these issues by establishing a zero-trust, policy-controlled commerce pipeline where conversational AI acts purely as an assistive interface, while trusted backend services retain absolute control over business logic, pricing, spending rules, payment verification, and auditability.

### The Core Architectural Principle

> **AI proposes → backend validates → policy engine decides → commerce service executes → audit service records.**

- **AI Proposes:** The LLM interprets the customer's natural language request (e.g., _"Prepare ingredients for Paneer Pulao for 4 people under ₹600"_), searches the catalog via schema-bounded tools, and formulates a proposed cart.
- **Backend Validates:** The server independently looks up real catalog items, verifies current inventory, normalizes units and pack sizes, and authoritatively calculates prices in integer paise.
- **Policy Engine Decides:** A deterministic, non-LLM rule engine evaluates user-defined mandates (order limits, daily limits, authorized merchants, allowed categories) and outputs `ALLOW`, `NEEDS_HUMAN_APPROVAL`, or `DENY`.
- **Commerce Service Executes:** If approved, inventory is reserved atomically with an expiry timer, a test-mode payment gateway order is generated, and checkout is executed upon server-verified payment signatures.
- **Audit Service Records:** All security-critical events, policy decisions, approvals, and financial transitions are committed to an append-only, SHA-256 hash-chained audit log for tamper-evident verification.

---

## 4. Key Differentiator

CartPilot does not claim that AI chatbots or grocery websites are novel in isolation. **The core differentiator is the rigorous architectural separation between unprivileged AI reasoning and trusted commerce execution.**

By enforcing deterministic spending mandates, purchase-specific cryptographic approvals, server-verified payments, and hash-chained auditability, CartPilot proves that autonomous shopping agents can be safely deployed without risking financial loss, inventory inconsistencies, or security breaches.
