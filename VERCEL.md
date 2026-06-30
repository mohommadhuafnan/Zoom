# Vercel deployment

## 1. Push `vercel.json`

The repo includes a root `vercel.json` that deploys both services:

- **frontend** — Vite React app at `/`
- **backend** — Express API at `/api` and Socket.io at `/socket.io`

Click **Refresh** on the Vercel import screen after pushing.

## 2. Environment variables (Vercel → Project → Settings → Environment Variables)

**Critical:** Add these for **Production** and **Preview** or the API will crash with `FUNCTION_INVOCATION_FAILED`.

### Backend service (required)

| Variable | Value |
|----------|--------|
| `SUPABASE_URL` | `https://gwnbndrcpjbskzzozgcc.supabase.co` |
| `SUPABASE_SECRET_KEY` | your Supabase secret key |
| `JWT_SECRET` | long random string (e.g. 32+ chars) |
| `CLIENT_URL` | `https://your-project.vercel.app` |

Optional: `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_JWKS_URL`

### Frontend service (optional)

| Variable | Value |
|----------|--------|
| `VITE_SUPABASE_URL` | your Supabase URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | your publishable key |

`VITE_API_URL=/api` is set in `frontend/.env.production` for production builds.

## 3. Supabase SQL

Run in Supabase SQL Editor:

1. `backend/prisma/supabase-init.sql`
2. `backend/prisma/supabase-scheduling.sql`

## 4. Redeploy

After env vars are set, redeploy from the Vercel dashboard.

## Local vs production

| | Local | Vercel |
|---|--------|--------|
| Frontend | http://localhost:5173 | https://your-app.vercel.app |
| API | http://localhost:5000/api | https://your-app.vercel.app/api |
| Socket.io | http://localhost:5000 | same origin (via rewrite) |
