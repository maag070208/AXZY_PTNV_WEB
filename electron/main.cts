/**
 * App de escritorio (Electron) del ERP. Carga el mismo build de Vite que se
 * publica en nginx (`dist/`), servido por el protocolo propio `app://ptnv`:
 * así las rutas absolutas del build (`/assets/…`, `/config.js`) funcionan sin
 * cambiar `base`, y el HashRouter no necesita servidor.
 *
 * La API vive en el servidor: su URL sale de `config.json` en la carpeta de
 * datos de la app (menú Servidor → Editar configuración), luego de
 * `PTNV_API_URL`, luego de `desktop.apiUrl` del package.json empaquetado
 * (`-c.extraMetadata.desktop.apiUrl=…` al empaquetar) y al final de la API local.
 *
 * `ELECTRON_DEV_URL` (p. ej. http://localhost:5006) carga el dev server de Vite.
 *
 * Las notificaciones del ERP (Ably → `window.desktop.notify`, ver
 * `preload.cts`) se muestran como notificaciones nativas del sistema.
 */
import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  net,
  Notification,
  protocol,
  shell,
  type MenuItemConstructorOptions,
} from "electron";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SCHEME = "app";
const APP_ORIGIN = `${SCHEME}://ptnv`;
const DIST = path.join(__dirname, "..", "dist");
const DEV_URL = process.env.ELECTRON_DEV_URL;
const LOCAL_API_URL = "http://localhost:4001/api/v1";
/** Igual que `appId` en electron-builder.yml: Windows agrupa las notificaciones por él. */
const APP_ID = "com.axzydev.puertonuevo.erp";

protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

// --- configuración (URL de la API) -------------------------------------------

interface DesktopConfig {
  apiUrl: string;
}

const configPath = (): string => path.join(app.getPath("userData"), "config.json");

const packagedApiUrl = (): string | undefined => {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(app.getAppPath(), "package.json"), "utf8"));
    return pkg.desktop?.apiUrl;
  } catch {
    return undefined;
  }
};

const defaultApiUrl = (): string => process.env.PTNV_API_URL || packagedApiUrl() || LOCAL_API_URL;

/** Se lee en cada carga para que un cambio aplique con solo recargar. */
const readConfig = (): DesktopConfig => {
  try {
    const saved = JSON.parse(fs.readFileSync(configPath(), "utf8")) as Partial<DesktopConfig>;
    if (typeof saved.apiUrl === "string" && saved.apiUrl.trim()) return { apiUrl: saved.apiUrl.trim() };
  } catch {
    // sin archivo (o inválido): se usa la URL por defecto
  }
  return { apiUrl: defaultApiUrl() };
};

const openConfigFile = async (): Promise<void> => {
  if (!fs.existsSync(configPath())) {
    fs.mkdirSync(path.dirname(configPath()), { recursive: true });
    fs.writeFileSync(configPath(), JSON.stringify(readConfig(), null, 2) + "\n");
  }
  const error = await shell.openPath(configPath());
  if (error) shell.showItemInFolder(configPath());
};

// --- protocolo app:// ---------------------------------------------------------

const registerAppProtocol = (): void => {
  protocol.handle(SCHEME, (request) => {
    const { pathname } = new URL(request.url);
    // Mismo contrato que render-config.sh en nginx.
    if (pathname === "/config.js") {
      const script = `window.__APP_CONFIG__ = ${JSON.stringify({ API_URL: readConfig().apiUrl })};\n`;
      return new Response(script, {
        headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-store" },
      });
    }
    const file = path.normalize(path.join(DIST, decodeURIComponent(pathname)));
    if (!file.startsWith(DIST + path.sep)) return new Response("Not found", { status: 404 });
    const target = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(DIST, "index.html");
    return net.fetch(pathToFileURL(target).toString());
  });
};

// --- ventana ------------------------------------------------------------------

const APP_URL = DEV_URL ?? `${APP_ORIGIN}/index.html`;
const isAppUrl = (url: string): boolean => url.startsWith(DEV_URL ?? APP_ORIGIN);
const isWebUrl = (url: string): boolean => /^https?:\/\//i.test(url);

let mainWindow: BrowserWindow | null = null;
let quitting = false;

/** Trae la ventana al frente (o la vuelve a crear si se cerró). */
const showWindow = (): void => {
  if (!mainWindow) {
    createWindow();
  } else {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
  if (process.platform === "darwin") app.focus({ steal: true });
};

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: "Puerto Nuevo",
    backgroundColor: "#f8fafc",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  // En macOS cerrar la ventana solo la oculta (la app sigue en el Dock y las
  // notificaciones siguen llegando); Cmd+Q sí sale.
  mainWindow.on("close", (event) => {
    if (process.platform !== "darwin" || quitting) return;
    event.preventDefault();
    mainWindow?.hide();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Adjuntos, documentos y mapas (`target="_blank"`) se abren en el navegador;
  // los `blob:` (PDFs generados) en una ventana de la app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("blob:")) return { action: "allow" };
    if (isWebUrl(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (isAppUrl(url)) return;
    event.preventDefault();
    if (isWebUrl(url)) void shell.openExternal(url);
  });

  void mainWindow.loadURL(APP_URL);
};

// --- notificaciones nativas ---------------------------------------------------

interface NotificationInput {
  id?: string;
  title: string;
  body?: string;
  route?: string;
}

/** Lo que manda el renderer es dato no confiable: solo texto acotado y rutas internas. */
const parseNotification = (value: unknown): NotificationInput | null => {
  if (!value || typeof value !== "object") return null;
  const { id, title, body, route } = value as Record<string, unknown>;
  if (typeof title !== "string" || !title.trim()) return null;
  return {
    id: typeof id === "string" ? id.slice(0, 100) : undefined,
    title: title.slice(0, 200),
    body: typeof body === "string" ? body.slice(0, 500) : undefined,
    route: typeof route === "string" && route.startsWith("/") ? route.slice(0, 300) : undefined,
  };
};

// Referencias vivas hasta que se cierran: si el GC se lleva la notificación,
// su clic ya no llega.
const shownNotifications = new Set<Notification>();

const registerNotifications = (): void => {
  const icon = path.join(DIST, "logo-puerto-nuevo.png");
  ipcMain.on("desktop:notify", (event, value: unknown) => {
    if (event.sender !== mainWindow?.webContents || !Notification.isSupported()) return;
    const input = parseNotification(value);
    if (!input) return;
    const notification = new Notification({ title: input.title, body: input.body ?? "", icon });
    const release = () => shownNotifications.delete(notification);
    notification.on("click", () => {
      release();
      showWindow();
      mainWindow?.webContents.send("desktop:notification-click", { id: input.id, route: input.route });
    });
    notification.on("close", release);
    shownNotifications.add(notification);
    notification.show();
  });
};

const buildMenu = (): void => {
  const isMac = process.platform === "darwin";
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: "appMenu" } as const] : []),
    { role: "fileMenu" },
    { role: "editMenu" },
    { role: "viewMenu" },
    {
      label: "Servidor",
      submenu: [
        { label: "Editar configuración…", click: () => void openConfigFile() },
        { type: "separator" },
        { label: "Recargar", accelerator: "CmdOrCtrl+Shift+R", click: () => mainWindow?.webContents.reloadIgnoringCache() },
      ],
    },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

// --- ciclo de vida --------------------------------------------------------------

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", showWindow);

  // Windows solo muestra notificaciones de una app con AppUserModelID (el
  // instalador crea el acceso directo con él; en desarrollo se usa el ejecutable).
  if (process.platform === "win32") app.setAppUserModelId(app.isPackaged ? APP_ID : process.execPath);

  void app.whenReady().then(() => {
    registerAppProtocol();
    registerNotifications();
    buildMenu();
    createWindow();
    app.on("activate", showWindow);
  });

  app.on("before-quit", () => {
    quitting = true;
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
