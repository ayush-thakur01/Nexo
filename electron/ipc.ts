import { ipcMain, BrowserWindow, app, shell } from "electron";
import { spawn } from "child_process";
import {
  loadSettings,
  saveSettings,
  registerSettingsHandlers,
} from "../src/system/settings";
import { resizeWindow } from "./main";
import {
  enableStartup,
  disableStartup,
  isStartupEnabled,
} from "../src/system/startup";
import { IPC_CHANNELS } from "../src/ipc/channels";

let cachedWindow: BrowserWindow | null = null;

function getWin(): BrowserWindow | null {
  if (cachedWindow && !cachedWindow.isDestroyed()) return cachedWindow;
  const wins = BrowserWindow.getAllWindows();
  if (wins.length > 0 && !wins[0].isDestroyed()) {
    cachedWindow = wins[0];
  }
  return cachedWindow;
}

export function registerIpcHandlers(): void {
  registerSettingsHandlers();

  ipcMain.on(
    "island:resize",
    (_event, { width, height }: { width: number; height: number }) => {
      resizeWindow(width, height);
    },
  );

  ipcMain.on(
    IPC_CHANNELS.ISLAND_PIN_TOGGLE,
    (_event, { pinned }: { pinned: boolean }) => {
      const win = getWin();
      if (win && !win.isDestroyed()) {
        win.setAlwaysOnTop(pinned, pinned ? "screen-saver" : "normal");
        win.setFocusable(pinned);
        win.setMovable(pinned);
      }
    },
  );

  ipcMain.handle("system:ready", () => ({
    platform: process.platform,
    version: app.getVersion(),
    arch: process.arch,
    isPackaged: app.isPackaged,
  }));

  ipcMain.on(IPC_CHANNELS.WINDOW_SHOW, () => {
    const win = getWin();
    if (win && !win.isDestroyed()) {
      win.show();
      win.setAlwaysOnTop(true, "screen-saver");
    }
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_HIDE, () => {
    const win = getWin();
    if (win && !win.isDestroyed()) win.hide();
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_TOGGLE, () => {
    const win = getWin();
    if (win) {
      if (win.isVisible()) win.hide();
      else {
        win.show();
        win.setAlwaysOnTop(true, "screen-saver");
      }
    }
  });

  ipcMain.handle("system:settings", () => loadSettings());
  ipcMain.on("system:settings:set", (_e, payload: unknown) => {
    saveSettings(payload as Parameters<typeof saveSettings>[0]);
  });

  ipcMain.on("window:set-always-on-top", (_e, on: boolean) => {
    const win = getWin();
    if (win && !win.isDestroyed()) {
      win.setAlwaysOnTop(!!on);
    }
  });

  ipcMain.on("app:quit", () => app.quit());

  ipcMain.handle("app:launch", async (_e, app2: string) => {
    const target = String(app2 || "")
      .trim()
      .toLowerCase();
    if (!target) return false;

    const protocols: Record<string, string> = {
      spotify: "spotify:",
      music: "zune:",
      media: "zune:",
      discord: "discord://",
      calculator: "calc:",
      phone: "msteams:",
      "youtube music": "https://music.youtube.com",
      youtube: "https://www.youtube.com",
      github: "https://github.com",
    };

    const executables: Record<string, string> = {
      explorer: "explorer.exe",
      "file explorer": "explorer.exe",
      files: "explorer.exe",
      terminal: "wt.exe",
      cmd: "cmd.exe",
      "command prompt": "cmd.exe",
      notepad: "notepad.exe",
      paint: "mspaint.exe",
      "task manager": "taskmgr.exe",
    };

    if (protocols[target]) {
      shell.openExternal(protocols[target]);
      return true;
    }
    const exe = executables[target];
    if (exe) {
      spawn(exe, [], { shell: true, windowsHide: true });
      return true;
    }
    // Fall back to the startup folder / registered protocol best-effort.
    shell.openExternal(`https://www.google.com/search?q=${encodeURIComponent(target)}`);
    return false;
  });

  ipcMain.handle(
    "startup:set",
    (_e, on: boolean) => (on ? enableStartup() : disableStartup()),
  );
  ipcMain.handle("startup:get", () => isStartupEnabled());
}
