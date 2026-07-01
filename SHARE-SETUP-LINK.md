# One-time: host setup file on GitHub (public link for friends)

Your friends use **https://zoom-xi-ten.vercel.app/download** — they never use localhost.

## Step 1 — Log in to GitHub (once)

```powershell
gh auth login --hostname github.com --git-protocol https --web
```

## Step 2 — Upload setup file + update Vercel

```powershell
cd "E:\web desinging\Zoom"
npm run publish:installer
```

This uploads `UniMeet-Setup-1.1.0.exe` to GitHub Releases and updates Vercel.

## Links to share

| Link | What friends get |
|------|------------------|
| **https://zoom-xi-ten.vercel.app/download** | Download page (recommended) |
| **https://github.com/mohommadhuafnan/Zoom/releases/latest/download/UniMeet-Setup-1.1.0.exe** | Direct setup file |

## Automatic builds (optional)

On GitHub → **Settings → Secrets → Actions**, add the same values as Vercel:

- `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_JWKS_URL`, `JWT_SECRET`, `CLIENT_URL` (= `https://zoom-xi-ten.vercel.app`)

Then: **Actions → Desktop Release → Run workflow** — builds and publishes a new installer online.
