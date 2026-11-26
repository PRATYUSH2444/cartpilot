# CARTPILOT — MAGNUM ARCHITECTURE & UI MASTER DIRECTIVE
### Production-Grade Autonomous Quick-Commerce Platform (Shopper · Merchant · Admin · AI Engine)

> **Document Classification:** Master Build & Engineering Specification  
> **Target System:** CartPilot Full-Stack Monorepo (`@cartpilot/api`, `@cartpilot/web`)  
> **Role:** Principal Systems & UX Engineer  

---

## 1. MISSION & HIGH-LEVEL OBJECTIVE

Transform **CartPilot** into a production-ready, ultra-premium, AI-powered quick-commerce application that merges the hyper-speed convenience of **Blinkit / Instamart / Zepto** with the autonomous intelligence of an **agentic shopping assistant** and a strict **100% Pure Vegetarian** guarantee.

Every feature must be **dynamically wired end-to-end** from database to frontend UI. There are **zero fakes, zero mock metrics, zero non-functional showcase buttons, and zero unauthenticated administrative leaks**.

---

## 2. PRODUCTION AUTHENTICATION & IDENTITY ARCHITECTURE

```mermaid
flowchart TD
    subgraph Public Consumer Gateway ["/login"]
        A["Shopper Phone OTP"] -->|Blinkit / Instamart style| B["POST /api/v1/auth/phone/send-otp"]
        B -->|Carrier SMS / Dev Fallback| C["4-Digit Code Entry Screen"]
        C -->|POST /api/v1/auth/phone/login| D["JWT Session + Refresh Cookie"]
        E["Google OAuth (Clerk / Native)"] -->|One-Tap Popup| D
        F["Live Geolocation"] -->|HTML5 GPS| G["Auto-Detect Serviceable Zone"]
    end

    subgraph Merchant Partner Gateway ["/login (Merchant Tab)"]
        H["Store Partner Email & Password"] -->|POST /api/v1/auth/login| I["Merchant Dashboard (/merchant)"]
    end

    subgraph Master Admin Suite ["/admin/login (Dedicated Route)"]
        J["Admin Secret Gateway"] -->|POST /api/v1/auth/login (Role: ADMIN)| K["Admin Suite (/admin)"]
    end

    D --> L["Shopper Store (/shopper)"]
```

### 2.1 Customer Identity Isolation
- **Phone Number Authentication:** Primary authentication method for shoppers. Formats Indian mobile numbers to E.164 (`+91XXXXXXXXXX`).
  - Calls `POST /api/v1/auth/phone/send-otp`. Dispatches 4-digit OTP via Twilio carrier SMS when environment variables are set; displays dev simulated SMS banner when carrier is unconfigured.
  - Calls `POST /api/v1/auth/phone/login`. Validates bcrypt-hashed OTP, auto-creates or retrieves customer record in MongoDB Atlas, and issues an authenticated JWT Bearer token + HTTP-only refresh cookie.
- **Location Auto-Detection (Blinkit Style):** Automatically triggers HTML5 `navigator.geolocation` on mount with fallback to active service zone (`HSR Layout, Bengaluru`). Displays live GPS status pill with pulsating radar indicator.
- **Google OAuth Integration:**
  - When `VITE_CLERK_PUBLISHABLE_KEY` is present in Vercel, launches `<SignInButton mode="modal">` with Clerk Google OAuth.
  - On OAuth completion, `ClerkBridge` invokes `POST /api/v1/auth/sync` with bearer token to idempotently sync user profile into MongoDB.
  - When Clerk key is omitted, falls back seamlessly to instant demo customer login.
- **Strict Role Isolation:**
  - **No Admin buttons or controls on the consumer login screen.**
  - Admin gateway is isolated to `/admin/login` or secured behind staff email credentials with database role verification (`role === 'ADMIN'`).
  - Merchants authenticate via the dedicated `Merchant Partner Hub` tab or `/become-merchant`.

---

## 3. GEN-Z / MILLENNIAL GLASSMORPHIC UI DESIGN SYSTEM

### 3.1 Design Language & Aesthetic Philosophy
- **Modern Glassmorphism & Aurora Gradients:**
  - Cards: `backdrop-blur-2xl bg-white/80 dark:bg-stone-900/85 border border-white/60 dark:border-stone-800 shadow-[0_25px_60px_-15px_rgba(16,185,129,0.18)]`.
  - Ambient backdrops: Multi-layered radial glowing aurora orbs in emerald, mint, teal, and electric lime.
  - Micro-interactions: Spring physics on button taps (`active:scale-[0.98]`), bouncy OTP digit inputs, and pulsating radar dots on live delivery pills.
- **Gen-Z / Alpha Playful Elements:**
  - Visual badges: `🥦 100% Certified Veg`, `⚡ 10-Min Flash Delivery`, `🤖 AI Autonomous Meal Planning`.
  - Punchy typography: Sans-serif display with tight tracking (`font-black tracking-tight`).
  - Mobile-first responsiveness: Seamless 2-column desktop split; compact, tactile single-column cards on iOS and Android viewports.

---

## 4. END-TO-END BACKEND & FRONTEND CONNECTIVITY

### 4.1 Production Cloud Infrastructure
1. **Frontend Host (Vercel):**
   - Configured with `apps/web/vercel.json` rewrites and single-page routing.
   - Environment Variable: `VITE_API_URL=https://<your-render-api>.onrender.com/api/v1`.
2. **Backend Gateway (Render):**
   - Runs `node apps/api/dist/server.js` with port binding `PORT=10000`.
   - Health Check: `GET /api/v1/health` verifying MongoDB connectivity.
   - Cross-Origin Resource Sharing: `CORS_ORIGIN=https://<your-vercel-app>.vercel.app` with `credentials: true`.
3. **Database (MongoDB Atlas):**
   - Connection URI in `MONGODB_URI` with IP whitelist `0.0.0.0/0`.
   - Collections: `users`, `products`, `orders`, `mandates`, `carts`, `audit_events`, `otp_verifications`.

### 4.2 Invariant Guarantees
- **100% Pure Vegetarian Catalog:**
  - Zero tolerance for meat, fish, poultry, or non-veg additives. Every SKU is flagged `isVegetarian: true`.
- **Financial Precision:**
  - Every price, wallet balance, delivery fee, and discount is calculated in **integer paise** (`₹1.00 = 100 paise`). Floating-point currency arithmetic is strictly banned.
- **Mandatory Verified Identity at Checkout:**
  - `POST /api/v1/checkout/initiate` validates `user.isEmailVerified === true` and `user.isPhoneVerified === true`. Rejects unverified checkouts with HTTP 403 `EMAIL_VERIFICATION_REQUIRED`.
- **Cryptographic Audit Ledger:**
  - Every financial transaction, mandate modification, and order status transition emits a SHA-256 hash-chained block into `audit_events`.

---

## 5. COMPLETE SCREEN VERIFICATION & EXECUTION CHECKLIST

| Screen / Flow | Role | Authentication Method | Live Verification Criteria |
| :--- | :--- | :--- | :--- |
| **Shopper Onboarding** | Customer | Mobile Phone OTP + Google | 4-digit code dispatch, instant auto-fill, GPS zone detection |
| **Shopper Home** | Customer | Authenticated Session | Midnight delivery countdown, wallet bonus pill, pure veg catalog |
| **AI Shopping Assistant** | Customer | Authenticated Session | Conversational recipe queries, pantry checks, autonomous cart updates |
| **Cart & Checkout** | Customer | Verified Email Guard | In-context OTP verification card, 403 server protection, integer paise totals |
| **Account & Orders** | Customer | Authenticated Session | Verification badges, live tracking status stepper, HMAC receipt proofs |
| **Merchant Hub** | Merchant | Email + Password | Live inventory toggles, order packing pipeline, catalog management |
| **Admin Control Suite** | Admin | Dedicated Admin Login | Immutable hash ledger viewer, system health integrations, role provisioning |

---

## 6. PRODUCTION DEPLOYMENT KEYS CHECKLIST

To enable fully dynamic third-party services in production:

1. **Vercel Environment Variables (`apps/web`):**
   - `VITE_API_URL`: URL of the deployed Render backend API.
   - `VITE_CLERK_PUBLISHABLE_KEY`: Clerk Publishable Key (`pk_live_...` or `pk_test_...`) to activate real Google OAuth popups.
2. **Render Environment Variables (`apps/api`):**
   - `MONGODB_URI`: MongoDB Atlas cluster connection string.
   - `CORS_ORIGIN`: Vercel app domain (`https://cartpilot-nine.vercel.app`).
   - `CLERK_SECRET_KEY`: Clerk Secret Key (`sk_live_...` or `sk_test_...`).
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`: Twilio SMS credentials for real carrier phone OTPs.
   - `GEMINI_API_KEY`: Google AI Studio key for agentic shopping assistant.
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`: Razorpay keys for payments.
