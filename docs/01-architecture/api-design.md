# CartPilot — API Boundary & Endpoint Design

All REST APIs in CartPilot are versioned under the `/api/v1` namespace. This document specifies the endpoint contracts, request/response formats, security guards, and error structures.

---

## 1. Standard Response & Error Conventions

### 1.1. Success Envelope

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

### 1.2. Error Envelope (Adhering to RFC 7807 Concepts)

```json
{
  "success": false,
  "error": {
    "code": "MANDATE_BUDGET_EXCEEDED",
    "message": "Cart total exceeds maximum allowed order limit of ₹600.00.",
    "details": {
      "cartTotalPaise": 72000,
      "maxLimitPaise": 60000
    }
  }
}
```

### 1.3. Standard Status Codes

- `200 OK`: Successful retrieval or update.
- `201 Created`: Successful creation of resource.
- `400 Bad Request`: Validation failure or schema violation.
- `401 Unauthorized`: Missing, expired, or invalid JWT token.
- `403 Forbidden`: Insufficient role or accessing unowned resource.
- `404 Not Found`: Target resource does not exist.
- `409 Conflict`: Concurrency conflict (e.g. cart version mismatch, out of stock).
- `422 Unprocessable Entity`: Business policy violation (`DENY` outcome).
- `429 Too Many Requests`: Rate limit reached.
- `500 Internal Server Error`: Unhandled application error (secrets scrubbed).
- `503 Service Unavailable`: Readiness check failure (DB down).

---

## 2. API Endpoint Catalog (`/api/v1`)

### 2.1. Authentication (`/api/v1/auth`)

| Method | Path             | Auth   | Roles  | Description                                                         |
| :----- | :--------------- | :----- | :----- | :------------------------------------------------------------------ |
| `POST` | `/auth/register` | None   | Public | Register new user account with role `CUSTOMER` or `MERCHANT`.       |
| `POST` | `/auth/login`    | None   | Public | Authenticate credentials; return access token & set refresh cookie. |
| `POST` | `/auth/refresh`  | None   | Public | Exchange valid refresh token cookie for new access token.           |
| `POST` | `/auth/logout`   | Bearer | All    | Revoke active refresh token and clear cookie.                       |
| `GET`  | `/auth/me`       | Bearer | All    | Retrieve current authenticated user profile and permissions.        |

### 2.2. Addresses (`/api/v1/addresses`)

| Method   | Path             | Auth   | Roles    | Description                                            |
| :------- | :--------------- | :----- | :------- | :----------------------------------------------------- |
| `GET`    | `/addresses`     | Bearer | Customer | List delivery addresses belonging to the current user. |
| `POST`   | `/addresses`     | Bearer | Customer | Create a new delivery address.                         |
| `PUT`    | `/addresses/:id` | Bearer | Customer | Update an existing address (enforces ownership).       |
| `DELETE` | `/addresses/:id` | Bearer | Customer | Delete an address (enforces ownership).                |

### 2.3. Catalog (`/api/v1/catalog`)

| Method | Path                  | Auth | Roles  | Description                                                            |
| :----- | :-------------------- | :--- | :----- | :--------------------------------------------------------------------- |
| `GET`  | `/catalog`            | None | Public | Search products by text query, category, price range, and merchant.    |
| `GET`  | `/catalog/:id`        | None | Public | Retrieve detailed product specification and real-time available stock. |
| `GET`  | `/catalog/categories` | None | Public | List available vegetarian grocery product categories.                  |

### 2.4. Cart (`/api/v1/cart`)

| Method   | Path                     | Auth   | Roles    | Description                                                                |
| :------- | :----------------------- | :----- | :------- | :------------------------------------------------------------------------- |
| `GET`    | `/cart`                  | Bearer | Customer | Get active cart items, current version, and authoritative price breakdown. |
| `POST`   | `/cart/items`            | Bearer | Customer | Add product to cart. Increments `cartVersion`.                             |
| `PATCH`  | `/cart/items/:productId` | Bearer | Customer | Update item quantity. Increments `cartVersion`.                            |
| `DELETE` | `/cart/items/:productId` | Bearer | Customer | Remove product from cart. Increments `cartVersion`.                        |
| `DELETE` | `/cart`                  | Bearer | Customer | Empty the active cart.                                                     |

### 2.5. Mandates (`/api/v1/mandate`)

| Method | Path       | Auth   | Roles    | Description                                                                 |
| :----- | :--------- | :----- | :------- | :-------------------------------------------------------------------------- |
| `GET`  | `/mandate` | Bearer | Customer | Get user's active spending mandate rules and budget caps.                   |
| `PUT`  | `/mandate` | Bearer | Customer | Configure order limit, daily budget, allowed merchants, blocked categories. |

### 2.6. Recipe Resolution (`/api/v1/recipe`)

| Method | Path              | Auth   | Roles    | Description                                                          |
| :----- | :---------------- | :----- | :------- | :------------------------------------------------------------------- |
| `POST` | `/recipe/resolve` | Bearer | Customer | Resolve recipe dish name & servings to catalog SKUs and pack counts. |

### 2.7. Agent Chat (`/api/v1/chat`)

| Method | Path                          | Auth   | Roles    | Description                                                                 |
| :----- | :---------------------------- | :----- | :------- | :-------------------------------------------------------------------------- |
| `POST` | `/chat/sessions`              | Bearer | Customer | Start a new conversational shopping session.                                |
| `POST` | `/chat/sessions/:id/messages` | Bearer | Customer | Send user prompt to LLM agent; executes tools; returns response & proposal. |
| `GET`  | `/chat/sessions/:id`          | Bearer | Customer | Retrieve chat transcript and historical tool runs.                          |

### 2.8. Approvals (`/api/v1/approvals`)

| Method | Path                     | Auth   | Roles    | Description                                                  |
| :----- | :----------------------- | :----- | :------- | :----------------------------------------------------------- |
| `GET`  | `/approvals/pending`     | Bearer | Customer | Get currently pending approval request for active cart.      |
| `POST` | `/approvals/:id/approve` | Bearer | Customer | Grant cryptographic approval for exact cart version & total. |
| `POST` | `/approvals/:id/reject`  | Bearer | Customer | Explicitly reject proposed purchase.                         |

### 2.9. Checkout (`/api/v1/checkout`)

| Method | Path                 | Auth   | Roles    | Description                                                                                  |
| :----- | :------------------- | :----- | :------- | :------------------------------------------------------------------------------------------- |
| `POST` | `/checkout/initiate` | Bearer | Customer | Revalidates stock, price, mandate, and approval; reserves inventory; creates Razorpay order. |

### 2.10. Payments & Webhooks (`/api/v1/payments` & `/api/v1/webhooks`)

| Method | Path                 | Auth   | Roles    | Description                                                                        |
| :----- | :------------------- | :----- | :------- | :--------------------------------------------------------------------------------- |
| `POST` | `/payments/verify`   | Bearer | Customer | Submit Razorpay payment signature for server-side cryptographic HMAC verification. |
| `POST` | `/webhooks/razorpay` | None   | Gateway  | Asynchronous webhook ingress. Requires raw body access for HMAC verification.      |

### 2.11. Orders (`/api/v1/orders`)

| Method | Path                        | Auth   | Roles        | Description                                                                 |
| :----- | :-------------------------- | :----- | :----------- | :-------------------------------------------------------------------------- |
| `GET`  | `/orders`                   | Bearer | Customer     | List user's historical orders with snapshot summaries.                      |
| `GET`  | `/orders/:id`               | Bearer | Customer     | View full immutable snapshot of order, delivery status, and payment record. |
| `POST` | `/orders/:id/simulate-step` | Bearer | Customer/Dev | Step simulated fulfillment (`CONFIRMED` → `PACKING` → etc.) for testing.    |

### 2.12. Audit (`/api/v1/audit`)

| Method | Path            | Auth   | Roles | Description                                                                         |
| :----- | :-------------- | :----- | :---- | :---------------------------------------------------------------------------------- |
| `GET`  | `/audit/events` | Bearer | Admin | Paginated list of recorded audit events (sequence, type, timestamp, actor, hashes). |
| `GET`  | `/audit/verify` | Bearer | Admin | Verifies cryptographic integrity of entire hash chain from sequence 1 to N.         |

### 2.13. Merchant Operations (`/api/v1/merchant`)

| Method | Path                     | Auth   | Roles    | Description                                                    |
| :----- | :----------------------- | :----- | :------- | :------------------------------------------------------------- |
| `GET`  | `/merchant/products`     | Bearer | Merchant | List products belonging exclusively to authenticated merchant. |
| `POST` | `/merchant/products`     | Bearer | Merchant | Create a new catalog product for this merchant.                |
| `PUT`  | `/merchant/products/:id` | Bearer | Merchant | Update product details, price in paise, or stock quantity.     |
| `GET`  | `/merchant/orders`       | Bearer | Merchant | View orders containing items from this merchant.               |

### 2.14. Diagnostics & Operations (`/api/v1/health` & `/api/v1/ready`)

| Method | Path      | Auth | Roles  | Description                                                       |
| :----- | :-------- | :--- | :----- | :---------------------------------------------------------------- |
| `GET`  | `/health` | None | Public | Liveness probe: returns HTTP 200 `{ status: "UP", uptime: 120 }`. |
| `GET`  | `/ready`  | None | Public | Readiness probe: pings MongoDB Atlas and returns HTTP 200/503.    |

---

## 3. Webhook Raw Body Signature Handling

Express parses request bodies into JSON by default, which can alter whitespace and break HMAC cryptographic signature verification. The webhook endpoint requires access to the unaltered raw buffer:

```typescript
app.use(
  '/api/v1/webhooks/razorpay',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    req.rawBody = req.body;
    next();
  }
);
```
