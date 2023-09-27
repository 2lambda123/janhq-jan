import {
  app,
  BrowserWindow,
  screen as electronScreen,
  ipcMain,
  dialog,
} from "electron";
import { resolve, join } from "path";
import { unlink, createWriteStream } from "fs";
import isDev = require("electron-is-dev");
import { init } from "./core/plugin-manager/pluginMgr";
const { autoUpdater } = require("electron-updater");
// @ts-ignore
import request = require("request");
// @ts-ignore
import progress = require("request-progress");

let mainWindow: BrowserWindow | undefined = undefined;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: electronScreen.getPrimaryDisplay().workArea.width,
    height: electronScreen.getPrimaryDisplay().workArea.height,
    show: false,
    backgroundColor: "white",
    webPreferences: {
      nodeIntegration: true,
      preload: join(__dirname, "preload.js"),
    },
  });

  ipcMain.handle(
    "invokePluginFunc",
    async (event, modulePath, method, ...args) => {
      const module = join(app.getPath("userData"), "plugins", modulePath);
      return await import(/* webpackIgnore: true */ module)
        .then((plugin) => {
          if (typeof plugin[method] === "function") {
            return plugin[method](...args);
          } else {
            console.log(plugin[method]);
            console.error(`Function "${method}" does not exist in the module.`);
          }
        })
        .then((res) => {
          return res;
        })
        .catch((err) => console.log(err));
    }
  );

  const startURL = isDev
    ? "http://localhost:3000"
    : `file://${join(__dirname, "../renderer/index.html")}`;

  mainWindow.loadURL(startURL);

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  if (isDev) mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  createMainWindow();
  setupPlugins();
  autoUpdater.checkForUpdates();

  ipcMain.handle("userData", async (event) => {
    return join(__dirname, "../");
  });

  ipcMain.handle("pluginPath", async (event) => {
    return join(app.getPath("userData"), "plugins");
  });

  /**
   * Used to delete a file from the user data folder
   */
  ipcMain.handle("deleteFile", async (_event, filePath) => {
    const userDataPath = app.getPath("userData");
    const fullPath = join(userDataPath, filePath);

    let result = "NULL";
    unlink(fullPath, function (err) {
      if (err && err.code == "ENOENT") {
        result = `File not exist: ${err}`;
      } else if (err) {
        result = `File delete error: ${err}`;
      } else {
        result = "File deleted successfully";
      }
      console.log(`Delete file ${filePath} from ${fullPath} result: ${result}`);
    });

    return result;
  });

  /**
   * Used to download a file from a given url
   */
  ipcMain.handle("downloadFile", async (_event, url, fileName) => {
    const userDataPath = app.getPath("userData");
    const destination = resolve(userDataPath, fileName);

    progress(request(url), {})
      .on("progress", function (state: any) {
        mainWindow?.webContents.send("FILE_DOWNLOAD_UPDATE", {
          ...state,
          fileName,
        });
      })
      .on("error", function (err: Error) {
        mainWindow?.webContents.send("FILE_DOWNLOAD_ERROR", {
          fileName,
          err,
        });
      })
      .on("end", function () {
        mainWindow?.webContents.send("FILE_DOWNLOAD_COMPLETE", {
          fileName,
        });
      })
      .pipe(createWriteStream(destination));
  });

  app.on("activate", () => {
    if (!BrowserWindow.getAllWindows().length) {
      createMainWindow();
    }
  });
});

/*New Update Available*/
autoUpdater.on("update-available", async (info: any) => {
  dialog.showMessageBox({
    message: `Update available. Current version ${app.getVersion()}`,
  });
  let pth = await autoUpdater.downloadUpdate();
  dialog.showMessageBox({
    message: pth.join(","),
  });
});

/*App Update Completion Message*/
autoUpdater.on("update-downloaded", (info: any) => {
  dialog.showMessageBox({
    message: `Update downloaded. Current version ${app.getVersion()}`,
  });
});

/*App Update Error */
autoUpdater.on("error", (info: any) => {
  dialog.showMessageBox({ message: info.message });
});

/*App Update Progress */
autoUpdater.on("download-progress", (progress: any) => {
  console.log("app update progress: ", progress.percent);
  sendStatusToWindow("APP_UPDATE_UPDATE", progress.percent);
});

function sendStatusToWindow(action: string, progress?: number) {
  mainWindow?.webContents.send(action, { progress });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function setupPlugins() {
  init({
    // Function to check from the main process that user wants to install a plugin
    confirmInstall: async (plugins: string[]) => {
      return true;
    },
    // Path to install plugin to
    pluginsPath: join(app.getPath("userData"), "plugins"),
  });
}
