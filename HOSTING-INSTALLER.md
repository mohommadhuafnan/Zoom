# Host the installer for sharing

Vercel cannot host the ~100 MB `.exe` file. Use one of these options:

## Option A — GitHub Releases (recommended)

1. Build the installer:
   ```bash
   npm run build:desktop
   ```

2. Create a GitHub release and upload the file:
   ```bash
   gh release create v1.0.0 "release/UniMeet Setup 1.0.0.exe#UniMeet-Setup.exe" --title "UniMeet 1.0.0" --notes "Windows desktop app"
   ```

3. Copy the download URL (example):
   ```
   https://github.com/mohommadhuafnan/Zoom/releases/download/v1.0.0/UniMeet-Setup.exe
   ```

4. Add to `backend/.env` and Vercel environment variables:
   ```
   APP_DOWNLOAD_URL=https://github.com/mohommadhuafnan/Zoom/releases/download/v1.0.0/UniMeet-Setup.exe
   ```

5. Redeploy: `vercel deploy --prod --yes`

Share this page with anyone:
**https://zoom-xi-ten.vercel.app/download**

---

## Option B — Google Drive / OneDrive

1. Upload `release/UniMeet Setup 1.0.0.exe` to Drive
2. Get a **direct download** link
3. Set `APP_DOWNLOAD_URL` to that link

---

## Option C — Share the file directly

Copy the installer from your PC and send it:
```
E:\web desinging\Zoom\release\UniMeet Setup 1.0.0.exe
```

Or zip it and share via WhatsApp / email / USB.

---

## Share link in the desktop app

Inside UniMeet desktop → open **Download** page (or share):

```
https://zoom-xi-ten.vercel.app/download
```

Users click **Download for Windows** to get the installer from `APP_DOWNLOAD_URL`.
