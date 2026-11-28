# CartPilot Role Entrypoints & Authentication Guide

This document defines the authoritative routing, access controls, credentials, and order fulfillment visibility across all three roles on the CartPilot platform.

---

## 1. Role Matrix & Credentials

| Role | Primary User Persona | Access URL | Seeded Demo Email | Seeded Demo Password | Role Privileges |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MASTER ADMIN** | Company Dark-Store Operator & Executive | `/admin/login`<br>`/admin` | `admin@cartpilot.com`<br>`admin@example.com` | `Admin1234!` | Full system governance, dark-store fulfillment hub, procurement runs, packing checklists, delivery manifests, merchant approvals, tamper-evident audit logs, cloud AI configuration. |
| **MERCHANT** | Independent Pure-Veg Supplier / Store Owner | `/login` (Merchant Tab)<br>`/merchant` | `merchant@freshgrocers.com`<br>`merchant@example.com` | `Merchant1234!` | Catalog & product management, stock adjustment, pickup lots handover, earnings ledger. **Zero Customer PII**. |
| **SHOPPER** | End-Consumer (Grocery Buyer) | `/login` (Shopper Tab)<br>`/shopper` | `customer@cartpilot.com`<br>`customer@example.com`<br>+91 98765 43210 (OTP) | `Customer1234!`<br>(or SMS OTP) | Browse pure-veg catalog, AI recipe assistant, multi-merchant cart, wallet payments, order status tracking. |
| **RUNNER / FIELD** | Dark-Store Collection Runner or Delivery Driver | `/field/run/:runToken`<br>(Tokenized Public Link) | *N/A (Link Token)* | *N/A (Link Token)* | Ephemeral mobile run sheet to mark merchant pickups collected or orders delivered without app login. |

---

## 2. Why "Merchant is Not Working" (Session Guard Explanation)

If you are already logged in as a **Shopper** (`role === 'CUSTOMER'`), the web application has an active session guard:
1. Navigating to `/login` will immediately auto-redirect you back to `/shopper` so shoppers do not get trapped on auth screens.
2. Navigating to `/merchant` will be blocked by `ProtectedRoute allowedRoles={['MERCHANT']}` and will redirect you back to `/shopper`.

### How to Access Merchant or Admin Right Now:
- **Option A (Sign Out First)**: In the Shopper view, tap **Account** in the bottom navigation (or the user avatar top-right) and click **Sign Out**. You will be returned to `/login`. Click the **Merchant Login** tab and click **"Instant 1-Tap Demo Merchant Access"** (or use `merchant@freshgrocers.com` / `Merchant1234!`).
- **Option B (Incognito / New Window)**: Open a private browsing tab and go to `https://cartpilot-nine.vercel.app/login` -> select **Merchant Login**.
- **Option C (Dedicated Admin Portal)**: Go directly to `https://cartpilot-nine.vercel.app/admin/login` and log in with `admin@cartpilot.com` / `Admin1234!`.
- **Option D (Instant Role Switcher)**: Use the bottom-right demo role switcher badge to swap roles in 1 tap.

---

## 3. Order Lifecycle & Where Orders Are Displayed

### The Fundamental Question: Does the order go to the Admin or the Merchant?
**Answer: It goes to BOTH, but with distinct, privacy-safe partitioning:**

```
                                  [ Shopper Places Order ]
                                  (Multi-Merchant Basket)
                                             │
                                             ▼
                     ┌────────────────────────────────────────────────┐
                     │   CENTRAL DATABASE / COMPANY DARK STORE (ADMIN)│
                     │  - Full consolidated order (CP-YYYYMMDD-XXXX)  │
                     │  - Shopper delivery address & contact details  │
                     │  - Total payment, platform fee, & taxes        │
                     │  - Order packing & driver dispatch manifest    │
                     └───────────────────────┬────────────────────────┘
                                             │
                       Midnight Cutoff / Aggregation Engine
                                             │
                     ┌───────────────────────┴────────────────────────┐
                     │                                                │
                     ▼                                                ▼
       ┌───────────────────────────┐                    ┌───────────────────────────┐
       │   MERCHANT A PICKUP LOT   │                    │   MERCHANT B PICKUP LOT   │
       │ (Fresh Greens Organics)   │                    │  (Desi Kirana & Spices)   │
       │ - 2x Baby Spinach         │                    │ - 1x Cumin Seeds (Jeera)  │
       │ - 1x Country Tomatoes     │                    │ - 1x Mustard Oil (1L)     │
       │                           │                    │                           │
       │ ❌ NO Shopper Name        │                    │ ❌ NO Shopper Name        │
       │ ❌ NO Delivery Address    │                    │ ❌ NO Delivery Address    │
       │ ❌ NO Customer Phone      │                    │ ❌ NO Customer Phone      │
       │ ❌ NO Total Basket Amount │                    │ ❌ NO Total Basket Amount │
       └───────────────────────────┘                    └───────────────────────────┘
```

1. **Company Dark Store (Admin Workspace `/admin`)**:
   - The company dark store is run by the **Master Admin**.
   - Admin sees the **entire customer order** under the **Fulfilment Console**:
     - Customer name, phone number, and delivery street address.
     - All items in the order, regardless of which merchant supplies them.
     - Dark-store packing bin status and driver dispatch sheets.
2. **Individual Merchants (`/merchant` -> Orders & Fulfilment)**:
   - Multiple merchants supply products to the platform.
   - When an order contains items from Merchant A and Merchant B:
     - Merchant A only sees their items (e.g. spinach, tomatoes) in their **Pickup Lot**.
     - Merchant B only sees their items (e.g. mustard oil, jeera) in their **Pickup Lot**.
   - **Zero PII Policy**: Merchants NEVER see who ordered the items, where the customer lives, or how much the customer paid in total. They only see what items to pack in the crate for the CartPilot collection runner.

---

## 4. End-to-End Fulfillment Timeline

1. **Shopper Checkouts** (Cutoff before 12:00 Midnight):
   - Items in the cart are locked and atomic stock reservation is consumed.
   - Status: `CONFIRMED`.
2. **Midnight Cutoff & Route Planning (00:00 - 05:00 AM)**:
   - The backend groups all items from confirmed orders for tomorrow's morning delivery run.
   - Creates a **Merchant Pickup Lot** for each merchant.
3. **Morning Merchant Procurement (05:00 AM - 06:30 AM)**:
   - Field runner visits each merchant store with a **Collection Run Sheet**.
   - Merchant hands over crates; runner scans/checks off items.
   - Lot status: `COLLECTED` -> items brought to CartPilot Dark Store Hub.
4. **Dark Store Sorting & Bin Packing (06:30 AM - 07:30 AM)**:
   - Hub staff packs customer bins combining items from all merchants.
   - Admin clicks **Pack Order** on the **Packing Checklist**.
   - Status: `PACKED`.
5. **Driver Dispatch & Out For Delivery (07:30 AM - 10:00 AM)**:
   - Orders assigned to route delivery driver with delivery manifest.
   - Driver marks orders as delivered; COD collected if applicable.
   - Status: `DELIVERED`. Cashback credited to shopper wallet.
