const { app, BrowserWindow, net, protocol } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const APP_NAME = "阿拉蕾文创工作台";
const APP_SCHEME = "alalei";

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
    },
  },
]);

app.setName(APP_NAME);

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  let mainWindow;

  const registerLocalAppProtocol = () => {
    const rendererRoot = path.resolve(__dirname, "renderer");
    protocol.handle(APP_SCHEME, (request) => {
      const url = new URL(request.url);
      if (url.host !== "app") return new Response("Not found", { status: 404 });

      const requestedFile = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
      const filePath = path.resolve(rendererRoot, requestedFile);
      const relativePath = path.relative(rendererRoot, filePath);
      const isSafe = relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);

      if (!isSafe) return new Response("Bad request", { status: 400 });
      return net.fetch(pathToFileURL(filePath).toString());
    });
  };

  const createWindow = () => {
    mainWindow = new BrowserWindow({
      width: 1440,
      height: 940,
      minWidth: 1024,
      minHeight: 700,
      show: false,
      backgroundColor: "#f2eee5",
      title: APP_NAME,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    mainWindow.removeMenu();
    mainWindow.once("ready-to-show", () => mainWindow.show());
    mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    mainWindow.webContents.on("will-navigate", (event, url) => {
      const destination = new URL(url);
      if (destination.protocol !== `${APP_SCHEME}:` || destination.host !== "app") event.preventDefault();
    });
    mainWindow.loadURL(`${APP_SCHEME}://app/index.html?desktop=1`);
  };

  app.whenReady().then(() => {
    registerLocalAppProtocol();
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
