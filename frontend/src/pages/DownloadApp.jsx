import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Copy,
  Check,
  Monitor,
  Video,
  Share2,
  ShieldAlert,
  Archive,
  ChevronRight,
} from 'lucide-react';
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
  const setupFileName = info?.version ? `UniMeet-Setup-${info.version}.exe` : 'UniMeet-Setup.exe';

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

          {/* Already installed — auto-update */}
          <div className="bg-blue-50 border border-blue-200 text-blue-900 text-sm px-4 py-3 rounded-xl">
            <p className="font-medium mb-1">Already have UniMeet installed?</p>
            <p className="text-blue-800 text-xs leading-relaxed">
              Just <strong>open the UniMeet app</strong> on your PC — updates appear automatically.
              You do <strong>not</strong> need to download again from this page.
            </p>
          </div>

          {/* Edge warning — matches what users see in the screenshot */}
          <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 space-y-3">
            <p className="font-semibold text-amber-950 flex items-center gap-2 text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
              Not an error — Edge may show a yellow warning
            </p>
            <p className="text-xs text-amber-900 leading-relaxed">
              After you click Download, Microsoft Edge may say{' '}
              <strong>&quot;{setupFileName} isn&apos;t commonly downloaded&quot;</strong> with an
              orange shield icon. This is <strong>normal</strong> for new apps. UniMeet is safe.
              Windows shows this because we are a student project without a paid certificate.
            </p>

            <div className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs space-y-2 border border-gray-700">
              <p className="text-gray-400 font-medium">What you will see in Edge Downloads:</p>
              <div className="flex items-center gap-2 bg-gray-800 rounded px-2 py-1.5">
                <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="truncate font-mono text-[11px]">{setupFileName}</span>
              </div>
              <p className="text-gray-400 italic">
                &quot;{setupFileName} isn&apos;t commonly downl...&quot;
              </p>
            </div>

            <p className="text-xs font-semibold text-amber-950">Follow these steps (do not turn off Windows Security):</p>
            <ol className="text-xs text-amber-950 space-y-2.5 list-none leading-relaxed">
              <li className="flex gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px] font-bold">
                  1
                </span>
                <span>
                  Press <kbd className="bg-amber-100 px-1 rounded font-mono">Ctrl+J</kbd> to open{' '}
                  <strong>Downloads</strong> in Edge (or click the download arrow at the top).
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px] font-bold">
                  2
                </span>
                <span>
                  Find <code className="bg-amber-100 px-1 rounded text-[11px]">{setupFileName}</code>{' '}
                  with the orange warning icon.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px] font-bold">
                  3
                </span>
                <span>
                  Click <strong>See more</strong> at the bottom of the warning box, then click{' '}
                  <strong>Keep anyway</strong> (or click <strong>⋯</strong> three dots →{' '}
                  <strong>Keep</strong>).
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px] font-bold">
                  4
                </span>
                <span>
                  Double-click the saved file. If SmartScreen appears → <strong>More info</strong>{' '}
                  <ChevronRight className="w-3 h-3 inline" /> <strong>Run anyway</strong>.
                </span>
              </li>
            </ol>
          </div>

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
              className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl border-2 border-orange-400 bg-orange-50 text-orange-900 hover:bg-orange-100 font-medium text-sm"
            >
              <Archive className="w-4 h-4" />
              Download as ZIP (if Edge still blocks the .exe)
            </a>
          )}

          <p className="text-xs text-gray-500 text-center">~100 MB · Windows 10/11 · Internet required</p>

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
