export const IPC_CHANNELS = {
  // Volume
  VOLUME_CHANGED: "volume:changed",
  VOLUME_SET: "volume:set",
  VOLUME_MUTE_TOGGLE: "volume:toggle-mute",

  // Media
  MEDIA_CHANGED: "media:changed",
  MEDIA_PLAY_PAUSE: "media:play-pause",
  MEDIA_NEXT: "media:next",
  MEDIA_PREVIOUS: "media:previous",
  MEDIA_STOP: "media:stop",

  // Notifications
  NOTIFICATION_RECEIVED: "notification:received",
  NOTIFICATION_DISMISS: "notification:dismiss",

  // Battery
  BATTERY_CHANGED: "battery:changed",
  BATTERY_GET: "battery:get",

  // Devices
  DEVICES_CHANGED: "devices:changed",

  // Network
  NETWORK_CHANGED: "network:changed",
  NETWORK_SPEED: "network:speed",

  // System capabilities
  SYSTEM_CAPABILITIES: "system:capabilities",
  SYSTEM_HEALTH: "system:health",

  // Brightness
  BRIGHTNESS_CHANGED: "brightness:changed",
  BRIGHTNESS_SET: "brightness:set",

  // Bluetooth devices
  BLUETOOTH_DEVICES: "bluetooth:devices",
  BLUETOOTH_DEVICES_REFRESH: "bluetooth:devices:refresh",

  // Night light
  NIGHTLIGHT_CHANGED: "nightlight:changed",
  NIGHTLIGHT_SET: "nightlight:set",

  // Focus assist (DND)
  FOCUS_CHANGED: "focus:changed",
  FOCUS_SET: "focus:set",

  // Clipboard
  CLIPBOARD_CHANGED: "clipboard:changed",

  // Wi-Fi
  WIFI_NETWORKS: "wifi:networks",
  WIFI_SCAN: "wifi:scan",
  WIFI_DISCONNECT: "wifi:disconnect",
  WIFI_TOGGLE: "wifi:toggle",
  BLUETOOTH_TOGGLE: "bluetooth:toggle",
  AIRPLANE_TOGGLE: "airplane:toggle",

  // Window
  WINDOW_SHOW: "window:show",
  WINDOW_HIDE: "window:hide",
  WINDOW_TOGGLE: "window:toggle",

  // Island
  ISLAND_RESIZE: "island:resize",
  ISLAND_TAP: "island:tap",
  ISLAND_LONG_PRESS: "island:long-press",
  ISLAND_RIGHT_CLICK: "island:right-click",

  // Pin
  ISLAND_PIN_TOGGLE: "island:pin:toggle",

  // AI Panel
  AI_OPEN: "ai:open",
  AI_COMMAND: "ai:command",

  // Settings
  SETTINGS_REQUEST: "settings:get",
  SETTINGS_UPDATED: "settings:updated",
  SETTINGS_RESET: "settings:reset",

  // Admin / privileged-operation errors
  SYSTEM_ERROR: "system:error",
} as const;
