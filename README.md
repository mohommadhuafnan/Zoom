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
- PostgreSQL 14+ (local or Docker)

## Quick Start

### 1. Database

```bash
# Create database (psql or pgAdmin)
CREATE DATABASE unimeet;
```

### 2. Backend

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
