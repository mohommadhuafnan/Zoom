import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Copy, Check, Monitor, Video, Share2 } from 'lucide-react';
import { fetchAppInfo, getDownloadPageUrl } from '../utils/appDownload';

export default function DownloadApp() {
  const [info, setInfo] = useState(null);
  const [copied, setCopied] = useState(false);
  const isDesktop =
    import.meta.env.VITE_DESKTOP === 'true' ||
    (typeof window !== 'undefined' && window.unimeetDesktop?.isDesktop);

  useEffect(() => {
    fetchAppInfo().then(setInfo);
  }, []);

  const shareUrl = info?.shareUrl || getDownloadPageUrl();
  const downloadUrl = info?.downloadUrl || info?.directSetupUrl;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copySetupLink = async () => {
    await navigator.clipboard.writeText(downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-zoom-blue rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Download UniMeet</h1>
          <p className="text-gray-500 mt-2">
            Install on your Windows PC — free video meetings for students
          </p>
          {info?.version && (
            <p className="text-xs text-gray-400 mt-1">Version {info.version}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-6">
          {isDesktop ? (
            <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
              <Monitor className="w-5 h-5 shrink-0 mt-0.5" />
              <span>You are using the desktop app. Share the link below so others can download it.</span>
            </div>
          ) : null}

          <a
            href={downloadUrl}
            download="UniMeet-Setup.exe"
            className="flex items-center justify-center gap-3 w-full bg-zoom-blue hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-md"
          >
            <Download className="w-5 h-5" />
            Download UniMeet Setup (Windows)
          </a>

          <button
            type="button"
            onClick={copySetupLink}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-zoom-blue hover:bg-blue-50 rounded-lg border border-blue-100"
          >
            <Copy className="w-4 h-4" />
            Copy direct setup file link
          </button>

          <p className="text-xs text-gray-500 text-center">
            ~100 MB · Windows 10/11 · Requires internet for meetings
          </p>

          <div className="border-t border-gray-100 pt-6">
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share download link
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 truncate"
              />
              <button
                type="button"
                onClick={copyLink}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Share the page link — friends open it and click Download to install on their PC.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
            <p className="font-medium mb-1">If Windows blocks the installer</p>
            <p className="text-amber-800 text-xs leading-relaxed">
              Open Settings → Privacy &amp; security → Windows Security → App &amp; browser control →
              turn off <strong>Smart App Control</strong>, then run the installer again. Click
              &quot;Run anyway&quot; if you see a security warning.
            </p>
          </div>

          <div className="flex justify-center gap-4 text-sm">
            <Link to="/login" className="text-zoom-blue hover:underline font-medium">
              Sign in
            </Link>
            <Link to="/register" className="text-zoom-blue hover:underline font-medium">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
