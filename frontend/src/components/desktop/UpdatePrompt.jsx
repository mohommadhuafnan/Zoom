import { useEffect, useState } from 'react';
import { Download, RefreshCw, X, AlertCircle } from 'lucide-react';

function isDesktopApp() {
  return (
    import.meta.env.VITE_DESKTOP === 'true' ||
    (typeof window !== 'undefined' && window.unimeetDesktop?.isDesktop)
  );
}

export default function UpdatePrompt() {
  const [open, setOpen] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('');
  const [newVersion, setNewVersion] = useState('');
  const [status, setStatus] = useState('idle');
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isDesktopApp() || !window.unimeetDesktop) return undefined;

    window.unimeetDesktop.getVersion?.().then((v) => setCurrentVersion(v || ''));

    const unsubscribe = window.unimeetDesktop.onUpdateStatus?.((data) => {
      if (!data?.status) return;

      switch (data.status) {
        case 'available':
          setNewVersion(data.version || '');
          setStatus('available');
          setOpen(true);
          setError('');
          break;
        case 'downloading':
          setStatus('downloading');
          setPercent(data.percent ?? 0);
          setOpen(true);
          break;
        case 'ready':
          setNewVersion(data.version || newVersion);
          setStatus('ready');
          setOpen(true);
          break;
        case 'error':
          if (open || status === 'downloading') {
            setError(data.message || 'Could not update');
            setStatus('error');
            setOpen(true);
          }
          break;
        default:
          break;
      }
    });

    return unsubscribe;
  }, [open, status, newVersion]);

  if (!open || !isDesktopApp()) return null;

  const handleDownload = async () => {
    setError('');
    setStatus('downloading');
    const result = await window.unimeetDesktop.downloadUpdate?.();
    if (result && !result.ok) {
      setError(result.message || 'Download failed');
      setStatus('error');
    }
  };

  const handleInstall = () => {
    window.unimeetDesktop.installUpdate?.();
  };

  const handleLater = () => {
    if (status !== 'downloading') {
      setOpen(false);
      setStatus('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        <button
          type="button"
          onClick={handleLater}
          disabled={status === 'downloading'}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-zoom-blue flex items-center justify-center">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Update available</h2>
            {currentVersion && (
              <p className="text-sm text-gray-500">
                v{currentVersion} → v{newVersion || '…'}
              </p>
            )}
          </div>
        </div>

        {status === 'available' && (
          <>
            <p className="text-sm text-gray-600 mb-6">
              A new version of UniMeet is ready. Update now to get the latest fixes and features.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 bg-zoom-blue hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-xl transition-colors"
              >
                Update now
              </button>
              <button
                type="button"
                onClick={handleLater}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-xl transition-colors"
              >
                Later
              </button>
            </div>
          </>
        )}

        {status === 'downloading' && (
          <>
            <p className="text-sm text-gray-600 mb-3">Downloading update… {percent}%</p>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-zoom-blue transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">Please keep UniMeet open until the download finishes.</p>
          </>
        )}

        {status === 'ready' && (
          <>
            <p className="text-sm text-gray-600 mb-6">
              Update downloaded. Restart UniMeet to finish installing v{newVersion}.
            </p>
            <button
              type="button"
              onClick={handleInstall}
              className="w-full flex items-center justify-center gap-2 bg-zoom-blue hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Restart and install
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex items-start gap-2 text-red-600 text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 bg-zoom-blue hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-xl"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={handleLater}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-xl"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
