# UniMeet Desktop Application

Install **UniMeet** on Windows, Mac, or Linux. Users run the app on their own PC — no browser required.

The desktop app includes:
- A native window (Electron)
- Built-in local server (API + WebRTC signaling)
- Camera, microphone, and multi-participant video calls

Meetings are still stored in **Supabase** (internet required for accounts and meeting data). Video uses local Socket.io signaling for reliable peer connections on desktop.

---

Share this link so anyone can download UniMeet on their PC:

**https://zoom-xi-ten.vercel.app/download**

After `npm run build:desktop`, deploy to Vercel so the installer is hosted online:

```bash
npm run build:desktop
vercel deploy --prod --yes
```

The download page includes a **Copy link** button for sharing.

---

## For developers — build the installer

### 1. Prerequisites

- [Node.js 18+](https://nodejs.org/)
- Your Supabase keys (same as web app)

### 2. Configure environment

Copy and fill in backend config:

```bash
copy backend\.env.example backend\.env
```

Edit `backend/.env` with your Supabase URL, keys, and JWT secret.

### 3. Install dependencies

From the project root:

```bash
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

### 4. Run in development (desktop window)

```bash
npm run desktop:dev
```

This starts the backend, Vite frontend, and opens the Electron window.

### 5. Build Windows installer (.exe)

```bash
npm run build:desktop
```

The installer is created in:

```
release/UniMeet Setup 1.0.0.exe
```

Share this file — anyone can install UniMeet on their Windows PC.

### 6. Build for all platforms (optional)

```bash
npm run build:desktop:all
```

---

## For end users — install and run

1. Download **UniMeet Setup x.x.x.exe** from your teacher/host.
2. Double-click and follow the installer.
3. Open **UniMeet** from the desktop shortcut or Start menu.
4. Sign in or join a meeting with a code — same as the web app.

**Note:** Internet is required for login and meeting storage. Camera/microphone permission is requested by Windows when you first join a call.

---

## Desktop vs web

| Feature | Web (Vercel) | Desktop app |
|--------|--------------|-------------|
| Install required | No | Yes (.exe installer) |
| Browser | Chrome, Edge, etc. | Built-in app window |
| Signaling | Supabase Realtime | Local Socket.io |
| API | Cloud | Local server in app |
| Database | Supabase | Supabase (cloud) |

The web app still works at your Vercel URL. Desktop is an additional way to use UniMeet.

---

## Troubleshooting

**App says “local server did not start”**  
Check `backend/.env` exists next to the project before building, or reinstall with a build that includes valid config.

**Camera not working**  
Allow camera access in Windows Settings → Privacy → Camera → enable for UniMeet.

**Build fails on Windows (symbolic link / code sign error)**  
Run: `npm run build:desktop:portable` — creates `release/win-unpacked/UniMeet.exe` without an installer.  
Or enable **Developer Mode** in Windows Settings → Privacy & Security → For developers, then run `npm run build:desktop` again.

---

## Project scripts (root)

| Command | Description |
|---------|-------------|
| `npm run desktop:dev` | Dev mode with Electron window |
| `npm run prepare:desktop` | Build frontend + copy to backend/public |
| `npm run build:desktop` | Create Windows installer in `release/` |
