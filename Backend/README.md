# Business Nexus — Backend

Node.js + Express + MongoDB + Socket.IO + Stripe

---

## Local Development

```bash
npm install
cp .env.example .env    # fill in MONGO_URI and JWT_SECRET at minimum
npm run seed            # load demo users (run once)
npm run dev             # starts on http://localhost:5000
```

Demo accounts after seeding:
- **Entrepreneur** → alex@techvision.com / password123
- **Investor** → michael@ventures.com / password123

---

## Deploy to Railway (free tier)

### Step 1 — Push to GitHub
```bash
cd business-nexus/Backend
git init
git add .
git commit -m "initial"
gh repo create business-nexus-backend --public --push --source=.
```

### Step 2 — Create Railway project
1. Go to [railway.app](https://railway.app) → **New Project**
2. Choose **Deploy from GitHub repo** → select `business-nexus-backend`
3. Railway auto-detects Node.js and runs `npm start`

### Step 3 — Add MongoDB Atlas database
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) → create a free M0 cluster
2. Create a database user (username + password)
3. Under **Network Access** → add `0.0.0.0/0` (allow all IPs)
4. Under **Connect** → choose **Drivers** → copy the connection string:
   ```
   mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/business_nexus?retryWrites=true&w=majority
   ```

### Step 4 — Set environment variables in Railway
In your Railway service → **Variables** tab, add:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | your Atlas connection string |
| `JWT_SECRET` | any long random string (min 32 chars) |
| `CLIENT_URL` | your Vercel frontend URL (add after frontend deploy) |
| `STRIPE_SECRET_KEY` | `sk_test_...` from stripe.com |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` from stripe.com |
| `STRIPE_WEBHOOK_SECRET` | see Stripe section below |

Railway gives you a URL like: `https://business-nexus-backend-production.up.railway.app`

### Step 5 — Seed demo data on Railway
```bash
# In Railway dashboard → your backend service → Shell tab
node src/utils/seeder.js
```

---

## Stripe Setup

1. Create account at [stripe.com](https://stripe.com)
2. Dashboard → **Developers** → **API Keys** → copy test keys
3. Add to Railway env variables
4. For the webhook secret:
   - Dashboard → **Developers** → **Webhooks** → **Add endpoint**
   - URL: `https://your-backend.up.railway.app/api/payments/webhook`
   - Event: `payment_intent.succeeded`
   - Copy the **Signing secret** (`whsec_...`) → add as `STRIPE_WEBHOOK_SECRET`

Test card: `4242 4242 4242 4242` · any future date · any CVC

---

## API Health Check

```
GET https://your-backend.up.railway.app/api/health
```
