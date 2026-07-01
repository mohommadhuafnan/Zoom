# Windows installer trust (no need to turn off security)

UniMeet is safe. Windows shows warnings because the installer is **not signed with a paid certificate** yet.

## What users can do today (no security off)

1. **Edge:** Downloads (Ctrl+J) → **⋯** → **Keep** → run installer → **More info** → **Run anyway**
2. **Chrome:** **Keep anyway** on the download warning
3. This is **not** turning off Windows Security — only allowing this one file

## Remove warnings completely (for developers)

### Option A — Submit to Microsoft (free, 1–3 days)

1. Open: https://www.microsoft.com/en-us/wdsi/filesubmission
2. Choose **Submit file for malware analysis**
3. Upload: `release/UniMeet-Setup-1.1.1.exe`
4. Select **Software developer** → submit

After approval, SmartScreen stops blocking for most users.

Run locally:
```powershell
powershell -File scripts/submit-smartscreen.ps1
```

### Option B — Code signing certificate (best, paid)

Buy an **OV Code Signing** certificate (~$200/year) from DigiCert, Sectigo, or SSL.com.

Set environment variables before `npm run build:desktop`:

```powershell
$env:CSC_LINK = "C:\path\to\certificate.pfx"
$env:CSC_KEY_PASSWORD = "your-password"
npm run build:desktop
```

electron-builder will sign the `.exe` — users install **without** warnings.

### Option C — Azure Trusted Signing

Microsoft Azure offers lower-cost signing for individuals:
https://learn.microsoft.com/en-us/azure/trust-center/azure-code-signing

---

## Meeting invite links (never localhost)

Set in `backend/.env` (desktop + server):

```
PUBLIC_APP_URL=https://zoom-xi-ten.vercel.app
```

Scheduled meetings will share: `https://zoom-xi-ten.vercel.app/join/MEETINGCODE`
