const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

// 1) Load .env file FIRST so process.env populated before any module reads it.
function loadDotEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}
loadDotEnv();

// 2) Apply hard-coded fallbacks from env.js, but never clobber real values from
//    .env or the host environment, and never overwrite with placeholders.
const env = require('./env');
const isPlaceholder = (v) =>
  !v ||
  /placeholder/i.test(v) ||
  v === 'sk-...' ||
  v === 'dg-...' ||
  /^sk-or-v1-\.\.\.$/i.test(v);

for (const [k, v] of Object.entries(env)) {
  if (!process.env[k] && !isPlaceholder(v)) process.env[k] = v;
}

// Diagnostics: confirm which AI keys actually loaded (no value leakage).
console.log('[Env] MISTRAL_KEY is hardcoded in api.js');

const { setupApiHandlers } = require('./api');

// Register custom protocol to handle Next.js absolute paths
function registerAppProtocol() {
  protocol.registerFileProtocol('app', (request, callback) => {
    let url = request.url.substr(6); // Strip 'app://'
    // Ensure we handle absolute paths by rooting them in renderer/out
    let filePath = path.join(__dirname, '..', 'renderer', 'out', url);
    
    // If it's a directory or doesn't have an extension, try adding .html
    if (!path.extname(filePath)) {
      if (fs.existsSync(filePath + '.html')) {
        filePath += '.html';
      } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
        filePath = path.join(filePath, 'index.html');
      }
    }
    
    callback({ path: filePath });
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    show: false, // Don't show until ready to prevent white flicker
  });

  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    // In production, use our custom app protocol
    win.loadURL('app://./index.html');
  }

  win.once('ready-to-show', () => {
    win.show();
  });
}

// Important: Standard scheme must be registered before app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

app.whenReady().then(() => {
  registerAppProtocol();
  setupApiHandlers();
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
