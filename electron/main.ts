import {
  app,
  BrowserWindow,
  globalShortcut,
  screen,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
} from "electron";
import * as path from "path";
import { registerIpcHandlers } from "./ipc";
import { nativeBridge } from "./nativeBridge";
import { IPC_CHANNELS } from "../src/ipc/channels";
import { isElevated, ADMIN_REQUIRED_MESSAGE } from "./services/adminService";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// --- Single instance -------------------------------------------------------
// Only one Nexo island may run at a time. A second launch focuses the
// existing window instead of spawning another.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}

app.on("second-instance", () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.show();
  mainWindow.setAlwaysOnTop(true, "screen-saver");
});

const IDLE_WIDTH = 280;
const IDLE_HEIGHT = 42;

// Top-center position for the floating overlay (10px from the top of the
// primary display's work area).
const ISLAND_TOP_OFFSET = 10;

export function resizeWindow(width: number, height: number): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const workArea = screen.getPrimaryDisplay().workArea;
  const x = Math.floor((workArea.width - width) / 2);
  mainWindow.setBounds(
    { x, y: workArea.y + ISLAND_TOP_OFFSET, width, height },
    true,
  );
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

function forwardToRenderer(channel: string, data: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

function createWindow(): void {
  const workArea = screen.getPrimaryDisplay().workArea;
  const x = Math.floor((workArea.width - IDLE_WIDTH) / 2);
  const y = workArea.y + ISLAND_TOP_OFFSET;

  mainWindow = new BrowserWindow({
    width: IDLE_WIDTH,
    height: IDLE_HEIGHT,
    x,
    y,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
      spellcheck: false,
    },
  });

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setMenuBarVisibility(false);
  // Highest always-on-top level so the pill beats the Windows desktop
  // spotlight / "transparent desktop icons" layer that otherwise occludes
  // the top of the screen and swallows clicks.
  mainWindow.setAlwaysOnTop(true, "screen-saver");
  // Per-pixel input: opaque pixels of the pill (and any expanded panel)
  // receive real mouse input, while transparent corners pass through to
  // the desktop behind. This is z-order independent - the OS hit-tests the
  // opaque pill pixels and routes clicks here even when the Windows desktop
  // spotlight layer sits above us. Requires the pill background to have real
  // alpha (see --island-bg); do NOT use backdrop-filter on a transparent
  // window or it writes alpha 0 and the pill becomes click-through.
  mainWindow.setIgnoreMouseEvents(false);

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "index.html"));
  } else {
    mainWindow.loadURL("http://localhost:3000");
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function setupTray(): void {
  try {
    const candidates = [
      path.join(__dirname, "..", "..", "public", "icon.png"),
      path.join(__dirname, "..", "public", "icon.png"),
      path.join(process.resourcesPath || "", "public", "icon.png"),
    ];
    let image = nativeImage.createEmpty();
    for (const p of candidates) {
      const img = nativeImage.createFromPath(p);
      if (!img.isEmpty()) {
        image = img;
        break;
      }
    }
    tray = new Tray(image);
    tray.setToolTip("Nexo");
    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: "Show / Hide",
          click: () => {
            if (mainWindow?.isVisible()) {
              mainWindow.hide();
            } else {
              mainWindow?.show();
            }
          },
        },
        {
          label: "Quit",
          click: () => {
            app.quit();
          },
        },
      ]),
    );
  } catch {}
}

function setupNativeBridge(): void {
  const channelMap: Record<string, string> = {
    "volume:changed": IPC_CHANNELS.VOLUME_CHANGED,
    "media:changed": IPC_CHANNELS.MEDIA_CHANGED,
    "notification:received": IPC_CHANNELS.NOTIFICATION_RECEIVED,
    "battery:changed": IPC_CHANNELS.BATTERY_CHANGED,
    "devices:changed": IPC_CHANNELS.DEVICES_CHANGED,
    "network:changed": IPC_CHANNELS.NETWORK_CHANGED,
    "network:speed": IPC_CHANNELS.NETWORK_SPEED,
    "system:capabilities": IPC_CHANNELS.SYSTEM_CAPABILITIES,
    "system:health": IPC_CHANNELS.SYSTEM_HEALTH,
    "brightness:changed": IPC_CHANNELS.BRIGHTNESS_CHANGED,
    "bluetooth:devices": IPC_CHANNELS.BLUETOOTH_DEVICES,
    "nightlight:changed": IPC_CHANNELS.NIGHTLIGHT_CHANGED,
    "focus:changed": IPC_CHANNELS.FOCUS_CHANGED,
    "wifi:networks": IPC_CHANNELS.WIFI_NETWORKS,
    "clipboard:changed": IPC_CHANNELS.CLIPBOARD_CHANGED,
  };

  for (const [nativeChannel, ipcChannel] of Object.entries(channelMap)) {
    nativeBridge.on(nativeChannel, (data) =>
      forwardToRenderer(ipcChannel, data),
    );
  }

  ipcMain.on(IPC_CHANNELS.VOLUME_SET, (_e, level: number) =>
    nativeBridge.send("volume:set", { level }),
  );
  ipcMain.on(IPC_CHANNELS.VOLUME_MUTE_TOGGLE, () =>
    nativeBridge.send("volume:toggle-mute"),
  );
  ipcMain.on(IPC_CHANNELS.MEDIA_PLAY_PAUSE, () =>
    nativeBridge.send("media:play-pause"),
  );
  ipcMain.on(IPC_CHANNELS.MEDIA_NEXT, () => nativeBridge.send("media:next"));
  ipcMain.on(IPC_CHANNELS.MEDIA_PREVIOUS, () =>
    nativeBridge.send("media:previous"),
  );
  ipcMain.on(IPC_CHANNELS.MEDIA_STOP, () => nativeBridge.send("media:stop"));
  ipcMain.on(IPC_CHANNELS.BRIGHTNESS_SET, (_e, data: { level: number }) => {
    if (!requireAdmin("brightness")) return;
    nativeBridge.send("brightness:set", { level: data.level });
  });
  ipcMain.on(IPC_CHANNELS.BLUETOOTH_DEVICES_REFRESH, () => {
    if (!requireAdmin("bluetooth")) return;
    nativeBridge.send("bluetooth:devices:refresh");
  });
  ipcMain.on(IPC_CHANNELS.NIGHTLIGHT_SET, (_e, data: { enabled: boolean }) =>
    nativeBridge.send("nightlight:set", { enabled: data.enabled }),
  );
  ipcMain.on(IPC_CHANNELS.FOCUS_SET, (_e, data: { enabled: boolean }) =>
    nativeBridge.send("focus:set", { enabled: data.enabled }),
  );
  ipcMain.on(IPC_CHANNELS.WIFI_SCAN, () => {
    if (!requireAdmin("wi-fi")) return;
    nativeBridge.send("wifi:scan");
  });
  ipcMain.on(IPC_CHANNELS.WIFI_DISCONNECT, () => {
    if (!requireAdmin("wi-fi")) return;
    nativeBridge.send("wifi:disconnect");
  });
  ipcMain.on(IPC_CHANNELS.WIFI_TOGGLE, () => {
    if (!requireAdmin("wi-fi")) return;
    nativeBridge.send("wifi:toggle");
  });
  ipcMain.on(IPC_CHANNELS.BLUETOOTH_TOGGLE, () => {
    if (!requireAdmin("bluetooth")) return;
    nativeBridge.send("bluetooth:toggle");
  });
  ipcMain.on(IPC_CHANNELS.AIRPLANE_TOGGLE, () => {
    if (!requireAdmin("airplane mode")) return;
    nativeBridge.send("airplane:toggle");
  });

  nativeBridge.start();
}

// Returns true when the operation may proceed. When Nexo is not running
// elevated, privileged Windows controls (Bluetooth / Wi-Fi / airplane / display
// brightness) cannot succeed, so we short-circuit with a clear error instead of
// pretending the action worked.
function requireAdmin(feature: string): boolean {
  if (isElevated()) return true;
  forwardToRenderer(IPC_CHANNELS.SYSTEM_ERROR, {
    message: ADMIN_REQUIRED_MESSAGE,
    feature,
  });
  return false;
}

app.whenReady().then(() => {
  createWindow();
  registerIpcHandlers();
  setupNativeBridge();
  setupTray();

  ipcMain.handle("admin:status", () => isElevated());

  globalShortcut.register("Control+Shift+D", () =>
    mainWindow?.webContents.send("hotkey:toggle"),
  );
  globalShortcut.register("Control+Shift+H", () => mainWindow?.hide());
  globalShortcut.register("Control+Shift+S", () =>
    mainWindow?.webContents.send("hotkey:settings"),
  );
  globalShortcut.register("Control+Shift+Q", () => app.quit());
});

app.on("window-all-closed", () => {
  nativeBridge.stop();
  globalShortcut.unregisterAll();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
