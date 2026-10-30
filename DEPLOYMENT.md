# CartPilot — Production Cloud Deployment Guide

This guide provides step-by-step instructions to deploy CartPilot to managed cloud infrastructure:
- **Frontend (Shopper, Merchant, Admin)**: [Vercel](https://vercel.com)
- **Backend API Gateway**: [Render](https://render.com)
- **Primary Database**: [MongoDB Atlas](https://www.mongodb.com/atlas)
- **External Integrations**: Google Gemini / OpenAI, Resend (Email), Twilio (SMS), Razorpay (Payments)

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │            Vercel (Frontend)           │
                      │  Shopper | Merchant Hub | Admin Suite  │
                      └───────────────────┬────────────────────┘
                                          │ HTTPS (VITE_API_URL)
                                          ▼
                      ┌────────────────────────────────────────┐
                      │              Render (API)              │
                      │     CartPilot Node.js / Express API    │
                      └───────┬──────────────┬──────────────┬──┘
                              │              │              │
       ┌──────────────────────┼──────────────┼──────────────┼──────────────────────┐
       ▼                      ▼              ▼              ▼                      ▼
┌──────────────┐       ┌─────────────┐┌──────────────┐┌────────────┐        ┌──────────────┐
│MongoDB Atlas │       │Google Gemini││    Resend    ││   Twilio   │        │   Razorpay   │
│Primary Cloud │       │  or OpenAI  ││Transactional ││Carrier SMS │        │ Cryptographic│
│  Datastore   │       │Real AI Engine│ Email API    │  & Phone OTP│        │   Payments   │
└──────────────┘       └─────────────┘└──────────────┘└────────────┘        └──────────────┘
```

---

## 1. Step 1: MongoDB Atlas Database Setup

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Create a **Shared Cluster (M0)** (Free Tier) in your preferred cloud region (e.g., `aws-ap-south-1` Mumbai or `aws-us-east-1`).
3. **Database Access**:
   - Go to **Security > Database Access** > click **Add New Database User**.
   - Authentication Method: **Password**.
   - Assign user role: **Read and write to any database**.
   - Save the username and strong password.
4. **Network Access**:
   - Go to **Security > Network Access** > click **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`) so Render services can connect dynamically.
5. **Connection String**:
   - Go to **Deployments > Database** > click **Connect**.
   - Choose **Drivers** (Node.js).
   - Copy the connection URI:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/cartpilot?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your credentials.

---

## 2. Step 2: Render Backend API Deployment

### Option A: Automatic Blueprint Deployment (Recommended)
1. Push your repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New > Blueprint**.
3. Select your repository. Render will automatically read `render.yaml` and configure the `cartpilot-api` service.
4. Fill in the required environment variables prompted by Render:
   - `MONGODB_URI`: Your MongoDB Atlas URI.
   - `GEMINI_API_KEY`: Your Google AI Studio key (`AIzaSy...`).
   - `CORS_ORIGIN`: Your Vercel frontend URL (or `*` temporarily).
   - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Razorpay keys.
   - `RESEND_API_KEY`: Resend key (`re_...`).

### Option B: Manual Web Service Setup
1. In Render Dashboard, click **New > Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name**: `cartpilot-api`
   - **Environment**: `Node`
   - **Region**: Oregon or Singapore
   - **Branch**: `main` (or your feature branch)
   - **Build Command**:
     ```bash
     npm install && npm run build --workspace=apps/api
     ```
   - **Start Command**:
     ```bash
     node apps/api/dist/server.js
     ```
   - **Health Check Path**: `/api/v1/health`
4. Add the **Environment Variables**:
   ```ini
   NODE_ENV=production
   PORT=10000
   LOG_LEVEL=info
   MONGODB_URI=mongodb+srv://...
   JWT_ACCESS_SECRET=your_super_secure_32_character_access_secret
   JWT_REFRESH_SECRET=your_super_secure_32_character_refresh_secret
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   CORS_ORIGIN=https://your-cartpilot-app.vercel.app
   AI_PROVIDER=gemini
   GEMINI_API_KEY=AIzaSy...
   GEMINI_MODEL=gemini-2.5-flash
   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL=CartPilot <onboarding@resend.dev>
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   RAZORPAY_WEBHOOK_SECRET=...
   ```
5. Click **Create Web Service**.
6. When deployment finishes, test the endpoint:
   ```bash
   curl https://cartpilot-api.onrender.com/api/v1/health
   ```
   It should return:
   ```json
   {
     "status": "UP",
     "timestamp": "2026-...",
     "database": { "status": "CONNECTED" }
   }
   ```

---

## 3. Step 3: Vercel Frontend Deployment

1. Log in to [Vercel](https://vercel.com) and click **Add New > Project**.
2. Import your GitHub repository.
3. In project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `apps/web` (or leave as root; `vercel.json` handles both)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   ```ini
   VITE_API_URL=https://cartpilot-api.onrender.com/api/v1
   ```
   *(Replace with your actual Render URL)*.
5. Click **Deploy**.
6. Once deployed, copy your production Vercel URL (e.g., `https://cartpilot.vercel.app`).
7. Update `CORS_ORIGIN` in Render to match your exact Vercel domain to ensure secure credentialed requests.

---

## 4. Step 4: External Services & API Keys

### 1. Google Gemini (AI Engine)
- Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
- Click **Create API Key**.
- Copy the key (`AIzaSy...`) into `GEMINI_API_KEY` on Render or configure it directly in the app via **AI & Integrations**.

### 2. OpenAI (Alternative AI Engine)
- Visit [OpenAI API Keys](https://platform.openai.com/api-keys).
- Create a secret key (`sk-proj-...`).
- Set `AI_PROVIDER=openai` and `OPENAI_API_KEY=sk-proj-...`.

### 3. Resend (Transactional Email)
- Register at [Resend.com](https://resend.com).
- Navigate to **API Keys** and generate a standard sending key (`re_...`).
- Verify a custom domain (or use testing sender `onboarding@resend.dev`).
- Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` on Render.

### 4. Twilio (Carrier Phone OTP)
- Create account at [Twilio.com](https://www.twilio.com).
- Copy **Account SID**, **Auth Token**, and obtain a phone number.
- Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.

### 5. Razorpay (Payments)
- Create account at [Razorpay Dashboard](https://dashboard.razorpay.com).
- Navigate to **Settings > API Keys** > Generate Test/Live Key.
- Copy **Key ID** and **Key Secret**.
- Set up a Webhook pointing to `https://<render-url>/api/v1/webhooks/razorpay` with secret `RAZORPAY_WEBHOOK_SECRET` and events:
  - `payment.captured`
  - `order.paid`

---

## 5. Post-Deployment Verification Checklist

- [ ] **System Status**: Open your Vercel deployment, navigate to **AI & Integrations** (or `/api/v1/system/integrations`) and verify all 6 services show green / configured.
- [ ] **Real Authentication**: Register a new user, log in, view profile at `/profile`.
- [ ] **Phone Verification**: Test OTP generation and verification on the profile page.
- [ ] **Catalog & Cart**: Browse products, add to cart, verify stock and pricing calculations in paise.
- [ ] **Real AI Assistant**: Send prompts (e.g. *"I need ingredients for Paneer Butter Masala"*), verify native tool calls and dynamic item additions.
- [ ] **Checkout & Payment**: Initiate checkout, confirm simulated or live Razorpay order, verify receipt email is logged or dispatched.
- [ ] **Multi-Tenant Hub**: Sign in as merchant (`merchant@cartpilot.test`) or admin (`admin@cartpilot.test`) and test inventory management and audit ledger.
