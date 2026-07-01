const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

const PORT = process.env.UNIMEET_PORT || '5123';
const isDev = !app.isPackaged;
let mainWindow = null;
let backendProcess = null;

function getBackendDir() {
  if (isDev) return path.join(__dirname, '..', 'backend');
  return path.join(process.resourcesPath, 'backend');
}

function loadBackendEnv(backendDir) {
  const env = {
    ...process.env,
    PORT,
    DESKTOP_MODE: 'true',
    NODE_ENV: 'production',
    CLIENT_URL: isDev ? 'http://localhost:5173' : `http://localhost:${PORT}`,
  };

  const dotenvPath = path.join(backendDir, '.env');
  if (fs.existsSync(dotenvPath)) {
    require('dotenv').config({ path: dotenvPath });
    Object.assign(env, process.env);
    env.PORT = PORT;
    env.DESKTOP_MODE = 'true';
    env.NODE_ENV = 'production';
    env.CLIENT_URL = isDev ? 'http://localhost:5173' : `http://localhost:${PORT}`;
  }

  return env;
}

function startBackend() {
  const backendDir = getBackendDir();
  const serverScript = path.join(backendDir, 'src', 'server.js');
  const env = loadBackendEnv(backendDir);

  if (!fs.existsSync(serverScript)) {
    dialog.showErrorBox(
      'UniMeet',
      `Backend not found at ${serverScript}. Reinstall the application.`
    );
    return;
  }

  const useElectronAsNode = !isDev;
  const cmd = useElectronAsNode ? process.execPath : 'node';
  const spawnEnv = useElectronAsNode ? { ...env, ELECTRON_RUN_AS_NODE: '1' } : env;

  backendProcess = spawn(cmd, [serverScript], {
    cwd: backendDir,
    env: spawnEnv,
    stdio: isDev ? 'inherit' : 'pipe',
    windowsHide: true,
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
    dialog.showErrorBox('UniMeet', `Could not start the local server: ${err.message}`);
  });

  if (!isDev && backendProcess.stderr) {
    backendProcess.stderr.on('data', (chunk) => console.error('[backend]', chunk.toString()));
  }
}

function waitForServer(url, attempts = 80) {
  return new Promise((resolve) => {
    let tries = 0;
    const tick = () => {
      http
        .get(url, (res) => {
          res.resume();
          if (res.statusCode === 200) resolve(true);
          else retry();
        })
        .on('error', retry);
    };
    const retry = () => {
      tries += 1;
      if (tries >= attempts) resolve(false);
      else setTimeout(tick, 400);
    };
    tick();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: 'UniMeet',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const startUrl = isDev ? 'http://localhost:5173' : `http://localhost:${PORT}`;
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://localhost') || url.startsWith('file://')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
    backendProcess = null;
  }
}

app.whenReady().then(async () => {
  startBackend();
  const ok = await waitForServer(`http://localhost:${PORT}/api/health`);
  if (!ok) {
    dialog.showErrorBox(
      'UniMeet',
      'The local server did not start. Check that backend/.env has valid Supabase keys, then try again.'
    );
    app.quit();
    return;
  }
  createWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', stopBackend);
