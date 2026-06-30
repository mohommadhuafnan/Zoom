# UniMeet — Free Web Video Conferencing for Students

A Zoom-like, web-based video conferencing app with **no meeting time limits**.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite) + Tailwind CSS |
| Backend | Node.js + Express |
| Real-time | WebRTC (mesh) + Socket.io signaling |
| Database | PostgreSQL + Prisma |
| Auth | JWT (email/password) |

## Project Structure

```
Zoom/
├── backend/                 # Express API + Socket.io signaling
│   ├── prisma/              # Database schema & migrations
│   └── src/
│       ├── index.js         # Server entry point
│       ├── config/          # DB, env, JWT config
│       ├── routes/          # REST API routes
│       ├── middleware/      # Auth middleware
│       ├── socket/          # Socket.io handlers (signaling, chat, presence)
│       ├── services/        # Business logic
│       └── storage/         # File storage abstraction (local → S3 later)
├── frontend/                # React SPA
│   └── src/
│       ├── pages/           # Route pages (Home, Login, Meeting, etc.)
│       ├── components/      # UI components (Zoom-like layout)
│       ├── hooks/           # WebRTC, socket, auth hooks
│       ├── context/         # Auth & meeting context
│       └── services/        # API & socket clients
└── README.md
```

## Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) project (PostgreSQL + optional Auth/Storage)

## Supabase setup

1. **Copy env files**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Set `DATABASE_URL` in `backend/.env`**
   - Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Settings → Database**
   - Copy the **Session pooler** connection string (IPv4-friendly)
   - Replace `[YOUR-PASSWORD]` with your DB password (`@` must be encoded as `%40`)
   - Example:
     ```
     postgresql://postgres.gwnbndrcpjbskzzozgcc:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require
     ```

3. **Create tables** — choose one:
   - **Option A (recommended if local migrate fails):** Supabase → **SQL Editor** → paste and run `backend/prisma/supabase-init.sql`
   - **Option B:** `cd backend && npx prisma migrate dev --name init`

4. **Add Supabase keys** to `backend/.env` and `frontend/.env` (from Settings → API)

5. **Restart backend** after changing `.env`

## Quick Start

### 1. Database

See **Supabase setup** above.

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run dev
```

Backend runs at **http://localhost:5000**

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

## Testing Each Step

See sections below as features are built.

### Step 1 — Scaffold

- Backend health: `GET http://localhost:5000/api/health` → `{ "status": "ok" }`
- Socket.io: open frontend, check browser console for "Connected to signaling server"
- Frontend: home page loads with Zoom-like sidebar layout

### Step 2 — Auth

- Register at `/register`, login at `/login`
- JWT stored in localStorage; protected routes redirect if not logged in

## Architecture Notes

- **Signaling ≠ media**: Socket.io only exchanges SDP/ICE; video/audio never touches the server
- **Mesh WebRTC**: Each peer connects to every other peer (ideal for ≤8 participants)
- **SFU-ready**: `useWebRTC` hook is isolated so mediasoup/LiveKit can replace mesh later
- **Storage**: `IStorageProvider` interface — swap `LocalDiskStorage` for S3 in production
