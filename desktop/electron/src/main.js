"use strict";
/* =========================================================================
 * RS KITS Desktop — processo principal (Electron)
 *
 * Camada "desktop" do produto:
 *   - janela do app (Next.js), ícone;
 *   - múltiplas janelas (segunda tela para o atleta);
 *   - recursos locais: sobe o backend FastAPI (SQLite no perfil do usuário);
 *   - comunicação com o backend online (NestJS) quando houver internet;
 *   - inicialização do sistema, instalador e atualização do aplicativo.
 *
 * Fluxo:
 *   1) spawn do backend (rskits-backend | main.py) apontado para
 *      app.getPath('userData')  ->  %AppData%/RS-KITS / ~/.config/RS-KITS;
 *   2) health-check em /api/health;
 *   3) sobe o build estático do Next.js (ou usa `next dev` em modo dev);
 *   4) abre a janela principal;
 *   5) segunda tela = nova BrowserWindow na rota /second-screen;
 *   6) encerramento derruba o backend junto.
 * ========================================================================= */

const { app, BrowserWindow, Menu, ipcMain, shell, screen } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { startStaticServer } = require("./static-server");

const PRODUCT = "RS KITS";
const DEV = process.env.RSKITS_DEV === "1";
const BACKEND_PORT = Number(process.env.RSKITS_BACKEND_PORT || 19090);
const STATIC_PORT = Number(process.env.RSKITS_STATIC_PORT || 19091);
const DEV_FRONTEND_URL = process.env.RSKITS_DEV_FRONTEND_URL || "http://127.0.0.1:3000";

app.setName("RS-KITS"); // pasta de dados fixa: %AppData%/RS-KITS (Windows)

let mainWindow = null;
let secondWindow = null;
let backendProcess = null;
let staticServer = null;

/* -------------------------------------------------------------------------
 * Caminhos
 * ------------------------------------------------------------------------- */
function userDataHome() {
  return app.getPath("userData"); // %AppData%/RS-KITS (Windows) | ~/.config/RS-KITS (Linux)
}

function backendBinary() {
  const dir = app.isPackaged ? path.join(process.resourcesPath, "backend") : path.join(__dirname, "..", "..", "dist");
  const name = process.platform === "win32" ? "rskits-backend.exe" : "rskits-backend";
  const bin = path.join(dir, name);
  return fs.existsSync(bin) ? bin : null;
}

function frontendOutDir() {
  if (app.isPackaged) return path.join(process.resourcesPath, "frontend");
  // Não empacotado: usa o build estático local do Next (frontend/out).
  return path.join(__dirname, "..", "..", "..", "frontend", "out");
}

function secondScreenStaticDir() {
  // Quando o frontend/out ainda não tiver rota /second-screen, caímos na SPA
  // offline (desktop/static) que já implementa a segunda tela.
  return path.join(__dirname, "..", "..", "static");
}

/* -------------------------------------------------------------------------
 * Backend local (FastAPI + SQLite)
 * ------------------------------------------------------------------------- */
function backendEnv() {
  const home = userDataHome();
  return {
    ...process.env,
    RSKITS_HOME: home,
    RSKITS_PORT: String(BACKEND_PORT),
    RSKITS_DATA_DIR: path.join(home, "database"),
    RSKITS_PACKAGES_DIR: path.join(home, "packages"),
    RSKITS_LOGS_DIR: path.join(home, "logs"),
    RSKITS_CONFIG_DIR: path.join(home, "config"),
    RSKITS_CACHE_DIR: path.join(home, "cache"),
  };
}

function spawnBackend(printFn) {
  const bin = backendBinary();
  const pythonMain = path.join(__dirname, "..", "..", "main.py");
  const args = bin ? ["--no-window", "--console-print"] : ["-u", pythonMain, "--no-window", "--console-print"];
  const command = bin || process.platform === "win32" ? "python" : "python3";

  backendProcess = spawn(bin || command, args, {
    env: backendEnv(),
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  const logName = path.join(userDataHome(), "logs", "backend.log");
  const read = (stream, tag) => {
    stream.on("data", (d) => {
      const lines = String(d).trim();
      if (!lines) return;
      fs.appendFile(logName, `[${tag}] ${lines}\n`, () => {});
      if (printFn) printFn(`[backend:${tag}] ${lines}`);
    });
  };
  read(backendProcess.stdout, "out");
  read(backendProcess.stderr, "err");
  backendProcess.on("exit", (code) => {
    if (printFn) printFn(`[backend] processo terminou (code=${code})`);
    backendProcess = null;
  });
}

function waitBackendHealthy(port, timeoutMs = 40000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.get({ host: "127.0.0.1", port, path: "/api/health", timeout: 2000 }, (res) => {
        res.resume();
        if (res.statusCode === 200) return resolve(true);
        retry();
      });
      req.on("error", retry);
      req.on("timeout", () => req.destroy());
    };
    const retry = () => {
      if (Date.now() - started > timeoutMs) return reject(new Error("Backend local não respondeu na porta " + port));
      if (!backendProcess) return reject(new Error("Backend local encerrou durante a inicialização."));
      setTimeout(tryOnce, 300);
    };
    tryOnce();
  });
}

/* -------------------------------------------------------------------------
 * Frontend (servir / janela)
 * ------------------------------------------------------------------------- */
async function startFrontend() {
  if (DEV) return DEV_FRONTEND_URL;
  const roots = [frontendOutDir(), secondScreenStaticDir()];
  staticServer = await startStaticServer(roots, STATIC_PORT);
  return `http://127.0.0.1:${STATIC_PORT}`;
}

function createMainWindow(frontendUrl) {
  mainWindow = new BrowserWindow({
    title: PRODUCT,
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#f8fafc",
    autoHideMenuBar: false,
    show: false,
    icon: path.join(__dirname, "..", "assets", process.platform === "win32" ? "icon.ico" : "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(frontendUrl);
  mainWindow.once("ready-to-show", () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes("/delivery/second-screen")) {
      createOrFocusSecondWindow(undefined, url);
      return { action: "deny" };
    }
    if (url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost")) return { action: "deny" };
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

function chooseSecondScreenBounds() {
  const displays = screen.getAllDisplays();
  if (displays.length > 1) {
    return displays.find((d) => d.id !== screen.getPrimaryDisplay().id)?.workArea || null;
  }
  return null;
}

function createOrFocusSecondWindow(frontendUrl, urlOverride) {
  if (secondWindow && !secondWindow.isDestroyed()) {
    if (secondWindow.isMinimized()) secondWindow.restore();
    secondWindow.focus();
    return;
  }
  const bounds = chooseSecondScreenBounds();
  secondWindow = new BrowserWindow({
    title: PRODUCT + " — Segunda tela",
    width: bounds ? bounds.width : 1024,
    height: bounds ? bounds.height : 768,
    x: bounds ? bounds.x : undefined,
    y: bounds ? bounds.y : undefined,
    backgroundColor: "#0f172a",
    autoHideMenuBar: true,
    fullscreen: !!bounds,
    skipTaskbar: !!bounds,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  const target = urlOverride || `${frontendUrl}/delivery/second-screen`;
  secondWindow.loadURL(target);
  secondWindow.on("closed", () => { secondWindow = null; });
}

function buildMenu(frontendUrl) {
  const template = [
    {
      label: "Arquivo",
      submenu: [
        { label: "Segunda tela", accelerator: "CmdOrCtrl+Shift+S", click: () => createOrFocusSecondWindow(frontendUrl) },
        { type: "separator" },
        { label: "Sair", role: "quit" },
      ],
    },
    {
      label: "Exibir",
      submenu: [
        { role: "reload" },
        { role: "toggleDevTools" },
        { role: "togglefullscreen" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* -------------------------------------------------------------------------
 * Auto-update (eletrônico; ignora falhas de rede silenciosamente)
 * ------------------------------------------------------------------------- */
function setupAutoUpdater() {
  if (!app.isPackaged) return;
  try {
    const { autoUpdater } = require("electron-updater");
    autoUpdater.autoDownload = true;
    autoUpdater.on("error", (err) => console.warn("[auto-update]", err.message));
    ipcMain.handle("rskits:update", () => autoUpdater.checkForUpdates().catch(() => null));
  } catch {
    /* sem servidor de atualizações — segue offline */
  }
}

/* -------------------------------------------------------------------------
 * Boot
 * ------------------------------------------------------------------------- */
const log = (...args) => console.log("[RS KITS Electron]", ...args);

async function bootstrap() {
  fs.mkdirSync(path.join(userDataHome(), "logs"), { recursive: true });

  // 1) backend local
  spawnBackend(log);
  await waitBackendHealthy(BACKEND_PORT);
  log("backend local OK em :" + BACKEND_PORT);

  // 2) frontend
  const frontendUrl = await startFrontend();
  log("frontend em " + frontendUrl);

  // 3) janela principal
  createMainWindow(frontendUrl);
  buildMenu(frontendUrl);

  ipcMain.handle("rskits:info", () => ({
    backendPort: BACKEND_PORT,
    appVersion: app.getVersion(),
    mode: DEV ? "dev" : "prod",
  }));
  ipcMain.on("open-second-screen", () => createOrFocusSecondWindow(frontendUrl));
}

app.whenReady().then(bootstrap);

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", () => {
  if (backendProcess) {
    try { backendProcess.kill(); } catch {}
  }
  if (staticServer) staticServer.close();
});