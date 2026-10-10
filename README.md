# CartPilot — Agent Commerce Gateway

[![CI Pipeline](https://github.com/agent-commerce-gateway/cartpilot/actions/workflows/ci.yml/badge.svg)](https://github.com/agent-commerce-gateway/cartpilot/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

CartPilot is a full-stack, policy-controlled commerce platform designed to safely bridge natural-language conversational AI agents with real e-commerce transactions.

### The Core Architectural Axiom

> **AI proposes → backend validates → policy engine decides → commerce service executes → audit service records.**

---

## 1. Monorepo Structure

```
agentic_e_commerce/
├── apps/
│   ├── api/                       # Express + TypeScript + Mongoose Backend
│   │   ├── src/
│   │   │   ├── app.ts             # Express application assembly
│   │   │   ├── server.ts          # Server listener & graceful shutdown
│   │   │   ├── config/            # Zod-validated environment config
│   │   │   ├── common/            # Error handling, request ID, logging
│   │   │   ├── database/          # MongoDB connection manager
│   │   │   └── modules/
│   │   │       └── health/        # Liveness (/health) & Readiness (/ready)
│   │   └── package.json
│   └── web/                       # React 18 + Vite + TypeScript + Tailwind CSS Frontend
│       ├── src/
│       │   ├── App.tsx            # Shopper & Dashboard UI skeleton
│       │   └── main.tsx
│       └── package.json
├── docs/                          # Comprehensive Phase 00 & 01 Specifications
│   ├── 00-requirements/           # Scope, problem statement, FRs, NFRs, stories, acceptance criteria
│   └── 01-architecture/           # Architecture diagrams, schemas, APIs, threat model, ADRs
├── .github/
│   └── workflows/ci.yml           # GitHub Actions validation pipeline
├── package.json                   # Root monorepo workspace configuration
├── tsconfig.base.json             # Shared strict TypeScript configuration
└── README.md
```

---

## 2. Prerequisites

- **Node.js:** `v20.0.0` or higher (verified on `v22.14.0`)
- **npm:** `v10.0.0` or higher
- **MongoDB:** MongoDB Atlas connection string or local MongoDB instance (`mongodb://127.0.0.1:27017/cartpilot_dev`)
- **Git**

---

## 3. Quickstart & Local Setup

### 3.1. Clone and Install

```bash
git clone https://github.com/agent-commerce-gateway/cartpilot.git
cd cartpilot
npm install
```

### 3.2. Environment Setup

The backend reads from `apps/api/.env`. A development template is provided:

```bash
# In apps/api directory:
cp .env.example .env
```

Key configuration parameters:

- `PORT=5000`
- `NODE_ENV=development`
- `MONGODB_URI=mongodb://127.0.0.1:27017/cartpilot_dev`
- `CORS_ORIGIN=http://localhost:5173`

### 3.3. Running Development Servers

To start the backend and frontend simultaneously:

```bash
# Run API Server (http://localhost:5000)
npm run dev:api

# Run Web Client (http://localhost:5173) in a second terminal
npm run dev:web
```

---

## 4. Verification & Testing

### 4.1. Run Automated Tests

```bash
npm test
```

Runs the Vitest suite verifying `/api/v1/health` and `/api/v1/ready` diagnostic endpoints, request-id tracing, and error responses.

### 4.2. Code Formatting & Linting

```bash
npm run format:check
npm run lint
```

### 4.3. Full Monorepo Build

```bash
npm run build
```

---

## 5. Development Roadmap Status

| Phase        | Description                                     | Status                     |
| :----------- | :---------------------------------------------- | :------------------------- |
| **Phase 00** | Business Foundations, Scope & Requirements      | **Completed & Signed Off** |
| **Phase 01** | Environment, Repository & Engineering Standards | **Completed & Verified**   |
| **Phase 02** | Data, Models, Seed Verification & Backend Core  | **Next Milestone**         |
| **Phase 03** | Cart, Server Pricing, Inventory & Payments      | Scheduled                  |
| **Phase 04** | Shopper Web Application                         | Scheduled                  |
| **Phase 05** | Order Lifecycle & Notifications                 | Scheduled                  |
| **Phase 06** | AI Agent, Chat & Recipe Resolver                | Scheduled                  |
| **Phase 07** | Policy Engine & Human Approvals                 | Scheduled                  |
| **Phase 08** | Audit Trail & Merchant/Admin Portals            | Scheduled                  |
| **Phase 09** | Security Hardening & 20-Scenario Benchmark      | Scheduled                  |
| **Phase 10** | Deployment & Release                            | Scheduled                  |
