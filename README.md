# Business Nexus

Business Nexus is a full-stack platform that connects **entrepreneurs** and **investors** — browse profiles, send collaboration requests, chat in real time, negotiate deals through a pipeline, share documents, and close funding with an integrated Stripe payment flow.

> The GitHub description/topics for this repo are currently empty, so GitHub shows no summary on the repo page — worth filling those in (see the note at the bottom).

## ✨ Features

- 🔐 **Real authentication** — JWT-based register/login/logout, `bcryptjs`-hashed passwords, password reset flow, rate-limited auth endpoints
- 👥 **Dual role model** — every user is an `entrepreneur` or `investor`, each with role-specific profile fields (startup details & funding needs vs. investment interests & portfolio)
- 🤝 **Collaboration requests** — investors and entrepreneurs can send, accept, or reject connection requests
- 💬 **Real-time chat** — Socket.IO-powered messaging between connected users
- 📞 **Video/voice calls** — peer-to-peer WebRTC calling (no media server cost)
- 💼 **Deal pipeline** — track deals through Negotiation → Term Sheet → Due Diligence → Closed, with amount, equity, and funding stage
- 💳 **Stripe payments** — investors fund a deal via a Stripe PaymentIntent; a webhook confirms payment and auto-closes the deal
- 📄 **Document sharing** — upload and share files between matched users
- 🔔 **Live notifications** — real-time notification feed for requests, messages, and deal updates
- 🛡️ **Hardened API** — Helmet, CORS, global + auth-specific rate limiting, centralized error handling

## 🛠️ Tech Stack

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO (real-time chat & notifications)
- JWT authentication + bcryptjs
- Stripe (payments)
- express-validator, helmet, express-rate-limit, multer

**Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS
- React Router
- Axios (with a JWT-attaching interceptor)
- Socket.IO client
- Stripe.js / React Stripe.js
- WebRTC (custom `useWebRTC` hook)
- react-hot-toast, react-dropzone, lucide-react

## 📁 Project Structure

```
nexus-platform/
├── Backend/
│   ├── src/
│   │   ├── config/db.js            # MongoDB connection
│   │   ├── controllers/            # auth, users, messages, collaboration,
│   │   │                           # documents, deals, notifications, payments
│   │   ├── middleware/             # auth (JWT), validate, upload, errorHandler
│   │   ├── models/                 # User, Message, CollaborationRequest,
│   │   │                           # Document, Deal, Notification, Payment
│   │   ├── routes/                 # one router per resource
│   │   ├── sockets/chatSocket.js   # Socket.IO event handling
│   │   ├── utils/                  # jwt helpers, notification creator, DB seeder
│   │   └── server.js               # app entry point
│   └── README.md                   # backend-specific setup & Railway deploy guide
└── Frontend/
    ├── src/
    │   ├── components/             # layout, chat, call, collaboration, ui kit
    │   ├── context/                # AuthContext, SocketContext
    │   ├── hooks/                  # useSocket, useWebRTC
    │   ├── pages/                  # auth, dashboard, profile, messages, deals,
    │   │                           # documents, notifications, settings, help
    │   ├── services/                # axios-based API layer (one file per resource)
    │   ├── types/index.ts           # shared TypeScript interfaces
    │   └── data/                    # ⚠️ leftover mock data, not imported anywhere (see below)
    └── README.md                    # frontend-specific setup & Vercel deploy guide
```

## How It Works

1. A user registers as either an **entrepreneur** or **investor**; the backend hashes the password and returns a JWT.
2. `AuthContext` on the frontend stores the user + token in `localStorage`; an Axios interceptor (`services/api.ts`) attaches the JWT to every request and redirects to `/login` on a 401.
3. Users browse the **Investors**/**Entrepreneurs** directories and send **collaboration requests**; once accepted, they can message each other in real time via Socket.IO and start a WebRTC call from the chat.
4. Investors and entrepreneurs track funding conversations as **Deals** (stage, amount, equity, status). When a deal is ready, the investor pays through Stripe; a webhook confirms the `payment_intent.succeeded` event and flips the deal to `Closed`.
5. Documents can be uploaded and shared between matched users; notifications fire in real time for new requests, messages, and deal changes.

## Getting Started

Full, already-written setup and deployment guides exist for each half of the app — this section summarizes them:

- **[Backend/README.md](./Backend/README.md)** — local dev, MongoDB Atlas + Railway deployment, Stripe setup (with test card numbers)
- **[Frontend/README.md](./Frontend/README.md)** — local dev, Vercel deployment

### Quick Start (local)

```bash
git clone https://github.com/Hasnain-jaffer/nexus-platform.git
cd nexus-platform

# Backend
cd Backend
npm install
cp .env.example .env      # fill in MONGO_URI and JWT_SECRET at minimum
npm run seed               # loads demo users (run once)
npm run dev                 # http://localhost:5000

# Frontend (in a separate terminal)
cd ../Frontend
npm install
cp .env.example .env       # VITE_API_URL=http://localhost:5000/api
npm run dev                  # http://localhost:5173
```

### Demo Accounts (after `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Entrepreneur | alex@techvision.com | password123 |
| Investor | michael@ventures.com | password123 |

## ⚠️ Repo Housekeeping

A few things worth cleaning up:

- **`Frontend/node_modules` is committed to git** — `Backend/.gitignore` correctly excludes `node_modules/`, but there's no `.gitignore` in `Frontend/` at all, so its `node_modules` (~200MB) got checked in. Add a `Frontend/.gitignore` with `node_modules/` and `dist/`, then run `git rm -r --cached Frontend/node_modules` to remove it from history going forward.
- **`Frontend/.env` is committed** — it only contains local dev URLs (no real secrets), but as a habit `.env` should be in `.gitignore` alongside `.env.example`, so a future secret doesn't get committed by accident.
- **`Frontend/src/data/*.ts`** (`users.ts`, `messages.ts`, `collaborationRequests.ts`) is unused mock data left over from early UI scaffolding — nothing in `src/pages` or `src/services` imports it anymore since the app is fully wired to the real API. Safe to delete.
- The root `README.md` this file replaces was an auto-scaffolded placeholder with unfilled `<!-- comments -->` — this version documents what's actually built.

## Roadmap

- [ ] Add a repo description + topics on GitHub (`mern`, `typescript`, `socket-io`, `stripe`, `webrtc`, etc.) so the project is discoverable
- [ ] Remove committed `node_modules` and add a proper `Frontend/.gitignore`
- [ ] Delete unused mock data files under `Frontend/src/data/`
- [ ] Automated tests (backend + frontend currently have none)
- [ ] CI pipeline (lint/build/test on push)
- [ ] Live demo link once deployed

## License

No license file is currently included — add one (e.g. MIT) if you intend to accept contributions or want others to know how they can reuse this code.

## Author

**Hasnain Jaffer**
GitHub: [@Hasnain-jaffer](https://github.com/Hasnain-jaffer)
