import { useEffect, useState, useCallback } from 'react';
import { Download, RefreshCw, X, AlertCircle, Loader2 } from 'lucide-react';

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
  const [manualMessage, setManualMessage] = useState('');

  const applyStatus = useCallback((data) => {
    if (!data?.status) return;

    switch (data.status) {
      case 'checking':
        setStatus('checking');
        setOpen(true);
        break;
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
        setNewVersion(data.version || '');
        setStatus('ready');
        setOpen(true);
        break;
      case 'manual':
        setNewVersion(data.version || '');
        setManualMessage(data.message || '');
        setStatus('manual');
        setOpen(true);
        break;
      case 'error':
        setError(data.message || 'Could not update');
        setStatus('error');
        setOpen(true);
        break;
      case 'not-available':
        setOpen(false);
        setStatus('idle');
        break;
      default:
        break;
    }
  }, []);

  useEffect(() => {
    if (!isDesktopApp() || !window.unimeetDesktop) return undefined;

    window.unimeetDesktop.getVersion?.().then((v) => setCurrentVersion(v || ''));

    window.unimeetDesktop.getUpdateStatus?.().then((pending) => {
      if (pending) applyStatus(pending);
    });

    window.unimeetDesktop.checkForUpdates?.();

    const unsubscribe = window.unimeetDesktop.onUpdateStatus?.(applyStatus);
    return unsubscribe;
  }, [applyStatus]);

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
    if (status !== 'downloading' && status !== 'checking') {
      setOpen(false);
      setStatus('idle');
    }
  };

  const canClose = status !== 'downloading' && status !== 'checking' && status !== 'ready';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        {canClose && (
          <button
            type="button"
            onClick={handleLater}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-zoom-blue flex items-center justify-center">
            {status === 'checking' ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Download className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {status === 'checking' ? 'Checking for updates…' : 'Update available'}
            </h2>
            {currentVersion && status !== 'checking' && (
              <p className="text-sm text-gray-500">
                v{currentVersion} → v{newVersion || '…'}
              </p>
            )}
          </div>
        </div>

        {status === 'checking' && (
          <p className="text-sm text-gray-600">
            UniMeet is looking for the latest version. You do not need to download from the website.
          </p>
        )}

        {status === 'available' && (
          <>
            <p className="text-sm text-gray-600 mb-6">
              A new version is ready. The update will download automatically — stay on this screen.
            </p>
            <button
              type="button"
              onClick={handleDownload}
              className="w-full bg-zoom-blue hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-xl transition-colors"
            >
              Update now
            </button>
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
            <p className="text-xs text-gray-500">
              Keep UniMeet open. No need to visit the download page.
            </p>
          </>
        )}

        {status === 'ready' && (
          <>
            <p className="text-sm text-gray-600 mb-6">
              Update ready. Restart UniMeet to install v{newVersion}.
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

        {status === 'manual' && (
          <>
            <p className="text-sm text-gray-600 mb-6">{manualMessage}</p>
            <button
              type="button"
              onClick={handleLater}
              className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-xl"
            >
              OK
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
                Later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
