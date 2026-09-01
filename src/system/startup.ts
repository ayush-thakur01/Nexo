import { app } from "electron";

export function enableStartup(): boolean {
  try {
    app.setLoginItemSettings({ openAtLogin: true });
    return app.getLoginItemSettings().openAtLogin;
  } catch {
    return false;
  }
}

export function disableStartup(): boolean {
  try {
    app.setLoginItemSettings({ openAtLogin: false });
    return !app.getLoginItemSettings().openAtLogin;
  } catch {
    return false;
  }
}

export function isStartupEnabled(): boolean {
  try {
    return app.getLoginItemSettings().openAtLogin;
  } catch {
    return false;
  }
}
