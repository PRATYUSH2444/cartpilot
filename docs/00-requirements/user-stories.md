# CartPilot — User Stories

This document captures the user stories defining user and system personas, motivations, and baseline expected behaviors.

---

## Customer Stories

### Story A: Natural-Language Recipe Shopping

- **As a** customer planning a meal,
- **I want to** describe a dish in natural language (e.g., _"Vegetarian Paneer Pulao for 4 people"_),
- **So that** the system automatically identifies the necessary ingredients, finds matching products in the catalog, calculates the necessary package counts, and builds a reviewable cart for me without manual searching.

### Story B: Budget-Controlled Purchasing & Policy Enforcement

- **As a** budget-conscious shopper,
- **I want to** configure my spending mandates (such as a ₹600 per-order limit and ₹1,500 daily allowance, or specific approved merchants),
- **So that** the AI shopping agent cannot propose or initiate purchases that exceed my configured financial boundaries.

### Story C: Purchase-Specific Explicit Human Approval

- **As a** customer delegating shopping tasks to an AI assistant,
- **I want to** review an exact, itemized summary of products, quantities, pack sizes, and total prices before any checkout is authorized,
- **So that** I maintain full control, and any subsequent modification to the cart or prices immediately invalidates any prior approval.

### Story D: Verifiable & Safe Payment Execution

- **As a** customer making a purchase,
- **I want my** payment to be verified securely on the server via Razorpay test mode,
- **So that** my order is confirmed only when the gateway confirms legitimate receipt of funds, protecting me from duplicate charges or phantom orders.

### Story E: Transparent Delivery Lifecycle Tracking

- **As a** customer who has completed checkout,
- **I want to** track my order through simulated preparation, packaging, dispatch, and delivery milestones,
- **So that** I have full visibility into my grocery fulfillment status in real-time.

---

## Merchant Stories

### Story F: Product & Inventory Management

- **As a** participating merchant,
- **I want to** manage my vegetarian product catalog, update prices in paise, adjust stock levels, and define aliases,
- **So that** the AI agent recommends accurate, in-stock products to shoppers.

### Story G: Merchant-Scoped Order Fulfillment

- **As a** merchant fulfiller,
- **I want to** view and process orders that contain my products,
- **So that** I can update fulfillment statuses without having access to other merchants' records or cross-merchant confidential data.

---

## Administrator Stories

### Story H: Cryptographic Audit Verification

- **As a** system administrator or compliance reviewer,
- **I want to** inspect the tamper-evident audit log and run an automated hash verification check across the chain,
- **So that** I can mathematically prove whether any logged event, policy decision, or financial transition has been modified, inserted, or deleted.

### Story I: System Diagnostics & Health Monitoring

- **As an** operator,
- **I want to** access `/api/v1/health` and `/api/v1/ready` endpoints,
- **So that** I can monitor backend process liveness, database connectivity, and external gateway availability.
