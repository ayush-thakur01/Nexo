import path from "path";

export const APP_NAME = "Nexo";
export const APP_ID = "com.nexo.windows";
export const APP_VERSION = "1.0.0";
export const IS_DEV =
  !process.env.NODE_ENV || process.env.NODE_ENV === "development";
export const APP_ICON = path.join(__dirname, "..", "public", "icon.ico");
export const PRELOAD_SCRIPT = path.join(__dirname, "preload.js");
export const MAIN_WINDOW_SIZE = { width: 420, height: 140 };
