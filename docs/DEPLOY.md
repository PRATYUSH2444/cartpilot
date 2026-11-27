# CartPilot Production Deployment Guide

This guide details the exact environment variables, secret keys, and deployment configuration required to run CartPilot with full functionality across **Vercel** (Frontend) and **Render** (Backend API).

---

## Architecture Overview

- **Frontend (Vercel)**: React 19 + Vite SPA, served with edge routing. All environment variables exposed to the browser must be prefixed with `VITE_`.
- **Backend API (Render)**: Node.js Express server connected to MongoDB Atlas. Runs behind HTTPS.
- **Support & Transactional Email**: Powered strictly by **HTTPS REST APIs** (Resend or Brevo).
  > **Important**: Render's free tier blocks all outbound SMTP ports (`25`, `465`, `587`). CartPilot uses zero SMTP/Nodemailer connections and sends emails exclusively through HTTPS POST requests.

---

## 1. Vercel Configuration (Frontend Web)

In your Vercel Dashboard, go to **Settings > Environment Variables** and configure:

| Variable Name | Required | Example / Description | Where to Obtain |
|---|---|---|---|
| `VITE_API_URL` | **Yes** | `https://cartpilot-api.onrender.com/api/v1` | Your deployed Render API service URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | **Yes** | `pk_test_...` or `pk_live_...` | [Clerk Dashboard](https://dashboard.clerk.com) > API Keys |
| `VITE_ADMIN_SUPPORT_EMAIL` | **Yes** | `prakash.extra20@gmail.com` | The administrator email address shown in the UI |

---

## 2. Render Configuration (Backend API)

In your Render Dashboard, select your Web Service and navigate to **Environment**:

### A. Core Server & Security
| Variable Name | Required | Default / Example | Purpose |
|---|---|---|---|
| `NODE_ENV` | **Yes** | `production` | Enables production optimizations & strict security validations |
| `PORT` | **Yes** | `10000` (Render default) or `5000` | Port for the Express server to listen on |
| `CORS_ORIGIN` | **Yes** | `https://cartpilot-nine.vercel.app` | Allowed frontend origin for Cross-Origin Resource Sharing |
| `CLIENT_ORIGIN` | **Yes** | `https://cartpilot-nine.vercel.app` | Validates CSRF origin and CORS requests |
| `JWT_ACCESS_SECRET` | **Yes** | `min-32-chars-random-string` | Cryptographic secret for signing access tokens |
| `JWT_REFRESH_SECRET` | **Yes** | `min-32-chars-random-string` | Cryptographic secret for signing refresh tokens |

### B. Database (MongoDB Atlas)
| Variable Name | Required | Example |
|---|---|---|
| `MONGODB_URI` | **Yes** | `mongodb+srv://<user>:<pwd>@cluster0.xxxxx.mongodb.net/cartpilot?retryWrites=true&w=majority` |

### C. HTTPS Email Delivery (Render Free Tier Safe)
CartPilot supports **Brevo** or **Resend**. Choose at least one:

#### Option 1: Brevo (Recommended — generous free tier, 300 emails/day)
1. Sign up at [https://brevo.com](https://brevo.com).
2. Go to **SMTP & API** > **API Keys**.
3. Generate a new API Key (starts with `xkeysib-...`).
4. Set in Render:
   - `BREVO_API_KEY`: `xkeysib-...`
   - `SUPPORT_TO_EMAIL`: `prakash.extra20@gmail.com`
   - `SUPPORT_FROM_EMAIL`: `CartPilot Support <your-verified-brevo-sender@domain.com>`

#### Option 2: Resend
1. Sign up at [https://resend.com](https://resend.com).
2. Go to **API Keys** and generate a key (starts with `re_...`).
3. Set in Render:
   - `RESEND_API_KEY`: `re_...`
   - `SUPPORT_TO_EMAIL`: `prakash.extra20@gmail.com`
   - `RESEND_FROM_EMAIL`: `CartPilot <onboarding@resend.dev>` (or your custom domain)
   - `SUPPORT_FROM_EMAIL`: `CartPilot Support <onboarding@resend.dev>`

### D. Clerk Authentication Integration
| Variable Name | Required | Where to Obtain |
|---|---|---|
| `CLERK_PUBLISHABLE_KEY` | **Yes** | [Clerk Dashboard](https://dashboard.clerk.com) > API Keys |
| `CLERK_SECRET_KEY` | **Yes** | [Clerk Dashboard](https://dashboard.clerk.com) > API Keys (`sk_test_...` or `sk_live_...`) |
| `CLERK_WEBHOOK_SECRET` | Optional | Webhook secret for syncing user events from Clerk |

### E. AI Engine & Payment Gateway
| Variable Name | Required | Example |
|---|---|---|
| `AI_PROVIDER` | **Yes** | `gemini` (or `openai`) |
| `GEMINI_API_KEY` | **Yes** (if `gemini`) | Get at [Google AI Studio](https://aistudio.google.com) |
| `GEMINI_MODEL` | Optional | `gemini-3.5-flash-lite` |
| `RAZORPAY_KEY_ID` | Optional | `rzp_test_...` from Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay key secret |

---

## 3. How the Help & Support Flow Operates

1. **User submits inquiry**: User selects a category (e.g. `📦 Order & Delivery`, `💳 Payment & Wallet`, `🥬 Item Quality`, `❓ General Question`) and enters their message in the Shopper portal (`/shopper`).
2. **Instant MongoDB Persistence**: The backend validates the input (topic enum, message length 1–1000 chars, HTML sanitization, rate limit 5/hour per user) and immediately generates a unique ticket (e.g. `TICK-M1A2B-7F49`) saved in the `support_tickets` collection.
3. **HTTPS API Dispatch**: The backend makes a direct HTTPS POST request to Brevo/Resend.
   - **Recipient**: Fixed on the server to `SUPPORT_TO_EMAIL` (`prakash.extra20@gmail.com`).
   - **Reply-To**: Automatically populated with the customer's email address and name. When the admin clicks "Reply" in their email app (Gmail, Outlook, etc.), it directly addresses the customer!
4. **Resilient Fallback**: If outbound email fails (e.g., temporary API downtime or invalid key), the ticket is saved with status `EMAIL_FAILED`, and the customer is still issued their valid ticket ID. No inquiries are ever dropped.
5. **Zero SMTP**: Operates 100% cleanly on cloud platforms that restrict SMTP egress.
