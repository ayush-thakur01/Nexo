import { app, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import os from "os";
import { Settings } from "../types";
import { IPC_CHANNELS } from "../ipc/channels";

function getUserDataPath(): string {
  if (app && typeof app.getPath === "function") return app.getPath("userData");
    return path.join(os.tmpdir(), "nexo");
}
function getSettingsPath(): string {
  return path.join(getUserDataPath(), "settings.json");
}

export function loadSettings(): Settings {
  try {
    const f = getSettingsPath();
    if (fs.existsSync(f)) {
      const parsed = JSON.parse(fs.readFileSync(f, "utf-8"));
      return { ...getDefaultSettings(), ...parsed };
    }
  } catch {}
  return getDefaultSettings();
}

export function saveSettings(settings: Settings): void {
  try {
    const f = getSettingsPath();
    const dir = path.dirname(f);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(f, JSON.stringify(settings, null, 2));
  } catch {}
}

export function getDefaultSettings(): Settings {
  return {
    startOnBoot: false,
    theme: "dark",
    accentColor: "#0a84ff",
    animationSpeed: 1,
    notificationTimeout: 5000,
    transparency: 0.85,
    blurIntensity: 28,
    cornerRadius: 9999,
    alwaysOnTop: true,
    soundEffects: true,
    pinned: false,
    enableNotifications: true,
    enableMediaControls: true,
    enableVolume: true,
    enableBrightness: true,
    enableBattery: true,
    enableClipboard: true,
    enableDownloads: true,
    enableScreenshot: true,
    enableMicrophoneIndicator: true,
    enableAIAssistant: true,
  };
}

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.SETTINGS_REQUEST, async () => loadSettings());
  ipcMain.on(IPC_CHANNELS.SETTINGS_UPDATED, (_e, settings: Settings) =>
    saveSettings(settings),
  );
}
