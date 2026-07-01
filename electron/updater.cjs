const { autoUpdater } = require('electron-updater');
const { ipcMain, app, dialog } = require('electron');
const https = require('https');

let ipcRegistered = false;
let updaterInitialized = false;
let activeWindow = null;
let lastStatus = null;
let apiFallbackDone = false;

function sendStatus(win, payload) {
  lastStatus = payload;
  if (win && !win.isDestroyed()) {
    win.webContents.send('update-status', payload);
  }
}

function broadcast(payload) {
  sendStatus(activeWindow, payload);
}

function parseVersion(v) {
  return String(v || '0')
    .replace(/^v/i, '')
    .split('.')
    .map((n) => parseInt(n, 10) || 0);
}

function isNewerVersion(remote, current) {
  const a = parseVersion(remote);
  const b = parseVersion(current);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

function getPublicAppUrl() {
  return (
    process.env.PUBLIC_APP_URL ||
    process.env.CLIENT_URL ||
    'https://zoom-xi-ten.vercel.app'
  ).replace(/\/$/, '');
}

async function checkViaApi(isDev) {
  if (isDev || apiFallbackDone) return;
  apiFallbackDone = true;

  try {
    const info = await fetchJson(`${getPublicAppUrl()}/api/app/info`);
    const current = app.getVersion();
    const remote = info?.version;

    if (!remote || !isNewerVersion(remote, current)) return;

    broadcast({ status: 'available', version: remote, source: 'api' });

    const { response } = await dialog.showMessageBox({
      type: 'info',
      title: 'UniMeet Update',
      message: `A new version (v${remote}) is available.`,
      detail:
        'You are on v' +
        current +
        '. Click "Update now" to download and install — no need to visit the website.',
      buttons: ['Update now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    });

    if (response === 0 && info.downloadUrl) {
      broadcast({ status: 'downloading', percent: 0 });
      const { shell } = require('electron');
      await shell.openExternal(info.downloadUrl);
      broadcast({
        status: 'manual',
        version: remote,
        message: 'When the download finishes, run the installer to update UniMeet.',
      });
    }
  } catch {
    // Server unreachable — electron-updater may still work
  }
}

function registerIpc() {
  if (ipcRegistered) return;
  ipcRegistered = true;

  ipcMain.handle('update:get-status', () => lastStatus);

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

function initAutoUpdater(isDev) {
  if (isDev || updaterInitialized) return;
  updaterInitialized = true;

  registerIpc();

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;

  autoUpdater.on('checking-for-update', () => broadcast({ status: 'checking' }));

  autoUpdater.on('update-available', (info) => {
    broadcast({ status: 'available', version: info.version, source: 'updater' });
    broadcast({ status: 'downloading', percent: 0 });
  });

  autoUpdater.on('update-not-available', () => {
    broadcast({ status: 'not-available' });
    checkViaApi(isDev);
  });

  autoUpdater.on('error', () => {
    checkViaApi(isDev);
  });

  autoUpdater.on('download-progress', (progress) =>
    broadcast({
      status: 'downloading',
      percent: Math.round(progress.percent || 0),
      transferred: progress.transferred,
      total: progress.total,
    })
  );

  autoUpdater.on('update-downloaded', (info) => {
    broadcast({ status: 'ready', version: info.version });

    const opts = {
      type: 'info',
      title: 'UniMeet Update Ready',
      message: `Version ${info.version} is ready.`,
      detail: 'Restart UniMeet to finish installing. You do not need to download from the website.',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    };

    if (activeWindow && !activeWindow.isDestroyed()) {
      dialog.showMessageBox(activeWindow, opts).then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall(false, true);
      });
    } else {
      dialog.showMessageBox(opts).then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall(false, true);
      });
    }
  });

  const check = () => {
    broadcast({ status: 'checking' });
    autoUpdater.checkForUpdates().catch(() => checkViaApi(isDev));
  };

  check();
  setInterval(check, 4 * 60 * 60 * 1000);
}

function attachUpdateWindow(mainWindow) {
  activeWindow = mainWindow;
  if (lastStatus) {
    sendStatus(mainWindow, lastStatus);
  }
}

module.exports = { initAutoUpdater, attachUpdateWindow };
