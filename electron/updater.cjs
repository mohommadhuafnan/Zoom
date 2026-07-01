const { autoUpdater } = require('electron-updater');
const { ipcMain } = require('electron');

let ipcRegistered = false;
let updaterInitialized = false;
let activeWindow = null;

function sendStatus(win, payload) {
  if (win && !win.isDestroyed()) {
    win.webContents.send('update-status', payload);
  }
}

function registerIpc() {
  if (ipcRegistered) return;
  ipcRegistered = true;

  ipcMain.handle('update:check', async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return { ok: true, updateInfo: result?.updateInfo ?? null };
    } catch (err) {
      return { ok: false, message: err?.message || 'Update check failed' };
    }
  });

  ipcMain.handle('update:download', async () => {
    try {
      await autoUpdater.downloadUpdate();
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err?.message || 'Download failed' };
    }
  });

  ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall(false, true);
  });
}

function setupAutoUpdater(mainWindow, isDev) {
  if (isDev) return;

  registerIpc();

  if (!updaterInitialized) {
    updaterInitialized = true;

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowDowngrade = false;

    autoUpdater.on('checking-for-update', () => broadcast({ status: 'checking' }));
    autoUpdater.on('update-available', (info) =>
      broadcast({ status: 'available', version: info.version })
    );
    autoUpdater.on('update-not-available', () => broadcast({ status: 'not-available' }));
    autoUpdater.on('error', (err) =>
      broadcast({ status: 'error', message: err?.message || 'Update check failed' })
    );
    autoUpdater.on('download-progress', (progress) =>
      broadcast({
        status: 'downloading',
        percent: Math.round(progress.percent || 0),
        transferred: progress.transferred,
        total: progress.total,
      })
    );
    autoUpdater.on('update-downloaded', (info) =>
      broadcast({ status: 'ready', version: info.version })
    );

    const check = () => {
      autoUpdater.checkForUpdates().catch(() => {});
    };

    setTimeout(check, 5000);
    setInterval(check, 4 * 60 * 60 * 1000);
  }

  activeWindow = mainWindow;
}

function broadcast(payload) {
  sendStatus(activeWindow, payload);
}

module.exports = { setupAutoUpdater };
