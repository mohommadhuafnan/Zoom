import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Copy, Check, Monitor, Video, Share2, ShieldAlert, Archive } from 'lucide-react';
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
  const zipUrl = info?.zipDownloadUrl;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-zoom-blue rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Download UniMeet</h1>
          <p className="text-gray-500 mt-2">Install on your Windows PC — free video meetings</p>
          {info?.version && (
            <p className="text-xs text-gray-400 mt-1">Version {info.version}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 space-y-5">
          {isDesktop && (
            <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
              <Monitor className="w-5 h-5 shrink-0 mt-0.5" />
              <span>Share the link below so others can download and install UniMeet.</span>
            </div>
          )}

          <a
            href={downloadUrl}
            className="flex items-center justify-center gap-3 w-full bg-zoom-blue hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-md"
          >
            <Download className="w-5 h-5" />
            Download Setup (.exe)
          </a>

          {zipUrl && (
            <a
              href={zipUrl}
              className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl border-2 border-zoom-blue text-zoom-blue hover:bg-blue-50 font-medium text-sm"
            >
              <Archive className="w-4 h-4" />
              Download as ZIP (if browser blocks .exe)
            </a>
          )}

          <p className="text-xs text-gray-500 text-center">~200 MB · Windows 10/11 · Internet required</p>

          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
            <p className="font-semibold text-amber-950 flex items-center gap-2 text-sm">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Browser says &quot;isn&apos;t commonly downloaded&quot;?
            </p>
            <p className="text-xs text-amber-900">
              This is normal for new apps. UniMeet is safe — Windows shows this because we are a
              student project without a paid certificate.
            </p>
            <ol className="text-xs text-amber-950 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                <strong>Microsoft Edge:</strong> In Downloads (Ctrl+J), find{' '}
                <code className="bg-amber-100 px-1 rounded">UniMeet-Setup</code> → click{' '}
                <strong>⋯</strong> (three dots) → <strong>Keep</strong>. Or click{' '}
                <strong>See more</strong> → <strong>Keep anyway</strong>.
              </li>
              <li>
                <strong>Google Chrome:</strong> Click the arrow on the download →{' '}
                <strong>Keep dangerous file</strong> or <strong>Keep anyway</strong>.
              </li>
              <li>
                <strong>After download:</strong> Double-click the file. If Windows SmartScreen
                appears → <strong>More info</strong> → <strong>Run anyway</strong>.
              </li>
              <li>
                <strong>Still blocked?</strong> Settings → Privacy &amp; security → Windows
                Security → App &amp; browser control → turn off{' '}
                <strong>Smart App Control</strong>, then run the installer again.
              </li>
            </ol>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share this page with friends
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
          </div>

          <div className="flex justify-center gap-4 text-sm pt-1">
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
