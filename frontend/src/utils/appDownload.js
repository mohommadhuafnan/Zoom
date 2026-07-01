const DEFAULT_VERSION = '1.2.1';
const GITHUB_REPO = 'mohommadhuafnan/Zoom';

export function getPublicAppBase() {
  const fromEnv = import.meta.env.VITE_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (import.meta.env.VITE_DESKTOP === 'true') {
    return 'https://zoom-xi-ten.vercel.app';
  }
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://zoom-xi-ten.vercel.app';
}

export function getDownloadPageUrl() {
  return `${getPublicAppBase()}/download`;
}

export function getInstallerUrl() {
  const custom = import.meta.env.VITE_INSTALLER_URL;
  if (custom) return custom;
  const version = import.meta.env.VITE_APP_VERSION || DEFAULT_VERSION;
  return `https://github.com/${GITHUB_REPO}/releases/latest/download/UniMeet-Setup-${version}.exe`;
}

export function getZipInstallerUrl() {
  const version = import.meta.env.VITE_APP_VERSION || DEFAULT_VERSION;
  return `https://github.com/${GITHUB_REPO}/releases/latest/download/UniMeet-Setup-${version}.zip`;
}

export async function fetchAppInfo() {
  try {
    const base =
      import.meta.env.VITE_API_URL ||
      (import.meta.env.VITE_DESKTOP === 'true'
        ? 'http://localhost:5123/api'
        : import.meta.env.PROD
          ? '/api'
          : 'http://localhost:5000/api');
    const res = await fetch(`${base}/app/info`);
    if (!res.ok) throw new Error('info failed');
    return res.json();
  } catch {
    return {
      name: 'UniMeet',
      version: DEFAULT_VERSION,
      downloadUrl: getInstallerUrl(),
      zipDownloadUrl: getZipInstallerUrl(),
      shareUrl: getDownloadPageUrl(),
    };
  }
}
