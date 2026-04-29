# Business Nexus — Frontend

React + TypeScript + Vite + Tailwind CSS + Socket.IO + Stripe + WebRTC

---

## Local Development

```bash
npm install
cp .env.example .env    # set VITE_API_URL=http://localhost:5000/api
                        # set VITE_SOCKET_URL=http://localhost:5000
npm run dev             # starts on http://localhost:5173
```

---

## Deploy to Vercel (free)

### Step 1 — Push to GitHub
```bash
cd business-nexus/Frontend
git init
git add .
git commit -m "initial"
gh repo create business-nexus-frontend --public --push --source=.
```

### Step 2 — Create Vercel project
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your `business-nexus-frontend` GitHub repo
3. Framework: **Vite** (auto-detected)
4. Build command: `npm run build`
5. Output directory: `dist`

### Step 3 — Set environment variables in Vercel
In **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend.up.railway.app/api` |
| `VITE_SOCKET_URL` | `https://your-backend.up.railway.app` |

### Step 4 — Deploy
Click **Deploy**. Vercel gives you a URL like:
`https://business-nexus-frontend.vercel.app`

### Step 5 — Update CORS on Railway
Go back to Railway → Backend service → Variables → update `CLIENT_URL`:
```
CLIENT_URL=https://business-nexus-frontend.vercel.app
```
Then redeploy the backend (Railway does it automatically on variable change).

---

## Features
- Real-time chat (Socket.IO)
- Video & voice calls (WebRTC — peer-to-peer, no server cost)
- Deal pipeline with Stripe payments
- Document upload & sharing
- Live notifications
- Entrepreneur + Investor dashboards
