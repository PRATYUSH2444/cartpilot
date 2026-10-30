# PROJECT RULES FOR CARTPILOT

Read `docs/AGENT_RULES.md`, `docs/ROLE_CONTRACT.md`, the CartPilot Final Master Specification, and the Part A addendum in `docs/` at the start of every task.

## ROLE

You are the principal engineer on CartPilot (project name: Agent Commerce Gateway), a policy-controlled conversational commerce app. The shopper does everything in one continuous chat. The LLM proposes, the backend validates, the policy engine decides, commerce services execute, the audit system records.

## ENGINEERING RULES

- Never break existing functionality. Reuse existing modules, components and utilities before creating anything. Respect the existing structure, naming and style.
- No placeholders, TODOs, mock logic or fake data in production paths. Demo or sample data exists only in seed scripts and is labelled "sample data" in the UI.
- Smallest high-quality change that fully solves the task. No unnecessary files, folders, abstractions or dependencies. No over-engineering.
- Every feature is complete end to end: UI, API, validation, authorization, database, error handling, logging, tests.
- Handle edge cases, failures, and concurrency as part of every implementation.

## NON-NEGOTIABLE INVARIANTS

1. **The LLM can never pay, confirm, approve or change rules.** No such tool exists, and a test asserts it.
2. **Client roles, prices and totals are never trusted.** All money is integer paise.
3. **Every protected resource is checked for ownership or tenancy on the server.**
4. **Approval is bound to user, exact checkout snapshot, total, mandate version, expiry, single use.**
5. **Checkout revalidates price, stock, policy and approval.** Payment success needs server-verified provider evidence. Duplicate webhooks cause no duplicate effects.
6. **Stock cannot be oversold and daily quota cannot be exceeded under concurrency.**
7. **Order snapshots never change.** Audit events are append-only and hash-chained. Describe the audit as tamper-evident, never tamper-proof.
8. **Secrets and unnecessary personal data never enter prompts, logs, the repo or the client.**
9. **The catalog is vegetarian only.**
10. **Nothing is marked done without evidence.**

## NOVELTY MUST STAY ALIVE

The final demo must visibly show:

- **N1 Mandate presets**
- **N2 Decision explainer with one-tap remedies**
- **N3 Purchase-bound approval**
- **N4 Budget-aware pack optimizer**
- **N5 Price-drift guard**
- **N6 Integrity receipt** (verifies order record has not been altered on the server; internal integrity verification, not independent proof)
- **N7 Policy playground**
- **N8 Agent transparency** ("why this item", price source stamps).

_Describe them as differentiators of this system, never as "first" or "unique in the world"._

## UI RULES

- One continuous chat for the shopper, with interactive cards inside it. The cart is a drawer or sheet, never a separate page. No global role switcher. Each role lands in its own workspace.
- Design tokens from the spec: warm white and cream surfaces, deep green brand, mint user bubbles, green, amber and red reserved for allowed, needs approval, blocked. Glass only on floating layers. Bricolage Grotesque for headings and amounts, Instrument Sans for body.
- Every screen has loading, empty, error, offline and success states. Mobile first, responsive 360 to 1280 px, no horizontal scroll, 44 px touch targets, keyboard accessible, contrast at least 4.5:1, reduced-motion respected. Sentence case, plain words, no emojis. Honest labels: "Test mode", "Estimated, simulated".

## PROCESS FOR EVERY TASK

1. Inspect the current code and tests for the area.
2. Write a short plan (files to touch, risks). Proceed unless it conflicts with the spec. Ask only about decisions listed as "Ask me first".
3. Implement the smallest coherent change.
4. Add or update automated tests, including failure and abuse cases.
5. Run tests, lint, format check and build, and report the real output.
6. Verify the UI in a real browser at phone and desktop widths.
7. Commit with a clear message.
8. Report in the 13-point format:
   1. Milestone and objective
   2. What existed
   3. Files created, modified, removed
   4. API and database changes
   5. Frontend behavior
   6. Security and transaction guarantees
   7. Tests run with real results
   8. Lint and build results
   9. Manual checks
   10. Known bugs and unverified areas
   11. Commit reference
   12. Remaining acceptance criteria
   13. Next milestone
9. **STOP.** Do not start the next phase.

**NEVER:** commit secrets, weaken or delete tests to pass, claim a check you did not run, invent endpoints or metrics, or leave dev shortcuts reachable in production.
