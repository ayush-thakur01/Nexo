import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../src/ipc/channels";

type Listener = (data: unknown) => void;
const listeners = new Map<string, Set<Listener>>();

function on(channel: string, callback: Listener): () => void {
  if (!listeners.has(channel)) listeners.set(channel, new Set());
  listeners.get(channel)!.add(callback);
  const wrapper = (_event: Electron.IpcRendererEvent, data: unknown) =>
    callback(data);
  (wrapper as unknown as { __original: Listener }).__original = callback;
  ipcRenderer.on(channel, wrapper);
  return () => {
    listeners.get(channel)?.delete(callback);
    ipcRenderer.removeListener(channel, wrapper);
  };
}

function off(channel: string, callback: Listener): void {
  listeners.get(channel)?.delete(callback);
  ipcRenderer.removeAllListeners(channel);
}

function send(channel: string, data?: unknown): void {
  ipcRenderer.send(channel, data);
}

function invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
  return ipcRenderer.invoke(channel, ...args) as Promise<T>;
}

contextBridge.exposeInMainWorld("api", {
  on,
  off,
  send,
  invoke,

  volume: {
    onChange: (
      cb: (data: {
        level: number;
        muted: boolean;
        previousLevel?: number;
      }) => void,
    ) => on(IPC_CHANNELS.VOLUME_CHANGED, cb as Listener),
    setLevel: (level: number) => send(IPC_CHANNELS.VOLUME_SET, level),
    toggleMute: () => send(IPC_CHANNELS.VOLUME_MUTE_TOGGLE),
  },

  media: {
    onChange: (cb: (data: unknown) => void) =>
      on(IPC_CHANNELS.MEDIA_CHANGED, cb as Listener),
    playPause: () => send(IPC_CHANNELS.MEDIA_PLAY_PAUSE),
    next: () => send(IPC_CHANNELS.MEDIA_NEXT),
    previous: () => send(IPC_CHANNELS.MEDIA_PREVIOUS),
    stop: () => send(IPC_CHANNELS.MEDIA_STOP),
  },

  notification: {
    onReceive: (cb: (data: unknown) => void) =>
      on(IPC_CHANNELS.NOTIFICATION_RECEIVED, cb as Listener),
  },

  battery: {
    onChange: (
      cb: (data: {
        level: number;
        charging: boolean;
        status: string;
        minutesRemaining?: number;
      }) => void,
    ) => on(IPC_CHANNELS.BATTERY_CHANGED, cb as Listener),
  },

  devices: {
    onChange: (
      cb: (data: { micActive: boolean; cameraActive: boolean }) => void,
    ) => on(IPC_CHANNELS.DEVICES_CHANGED, cb as Listener),
  },

  network: {
    onChange: (cb: (data: unknown) => void) =>
      on(IPC_CHANNELS.NETWORK_CHANGED, cb as Listener),
    onSpeed: (
      cb: (data: {
        downBps: number;
        upBps: number;
        adapter: string;
        ipv4?: string;
      }) => void,
    ) => on(IPC_CHANNELS.NETWORK_SPEED, cb as Listener),
  },

  quickControls: {
    onCapabilities: (cb: (data: unknown) => void) =>
      on(IPC_CHANNELS.SYSTEM_CAPABILITIES, cb as Listener),
    onBrightness: (
      cb: (data: { level: number; supported: boolean; error?: string }) => void,
    ) => on(IPC_CHANNELS.BRIGHTNESS_CHANGED, cb as Listener),
    setBrightness: (level: number) =>
      send(IPC_CHANNELS.BRIGHTNESS_SET, { level }),
    onBluetoothDevices: (cb: (data: unknown) => void) =>
      on(IPC_CHANNELS.BLUETOOTH_DEVICES, cb as Listener),
    refreshBluetoothDevices: () => send(IPC_CHANNELS.BLUETOOTH_DEVICES_REFRESH),
    onNightLight: (cb: (data: unknown) => void) =>
      on(IPC_CHANNELS.NIGHTLIGHT_CHANGED, cb as Listener),
    setNightLight: (enabled: boolean) =>
      send(IPC_CHANNELS.NIGHTLIGHT_SET, { enabled }),
    onFocus: (cb: (data: unknown) => void) =>
      on(IPC_CHANNELS.FOCUS_CHANGED, cb as Listener),
    setFocus: (enabled: boolean) => send(IPC_CHANNELS.FOCUS_SET, { enabled }),
    onWifiNetworks: (cb: (data: unknown) => void) =>
      on(IPC_CHANNELS.WIFI_NETWORKS, cb as Listener),
    scanWifi: () => send(IPC_CHANNELS.WIFI_SCAN),
    disconnectWifi: () => send(IPC_CHANNELS.WIFI_DISCONNECT),
    toggleWifi: () => send(IPC_CHANNELS.WIFI_TOGGLE),
    toggleBluetooth: () => send(IPC_CHANNELS.BLUETOOTH_TOGGLE),
    toggleAirplane: () => send(IPC_CHANNELS.AIRPLANE_TOGGLE),
    onHealth: (cb: (data: unknown) => void) =>
      on(IPC_CHANNELS.SYSTEM_HEALTH, cb as Listener),
    onClipboard: (cb: (data: unknown) => void) =>
      on(IPC_CHANNELS.CLIPBOARD_CHANGED, cb as Listener),
  },

  window: {
    show: () => send(IPC_CHANNELS.WINDOW_SHOW),
    hide: () => send(IPC_CHANNELS.WINDOW_HIDE),
    toggle: () => send(IPC_CHANNELS.WINDOW_TOGGLE),
    quit: () => send("app:quit"),
    setAlwaysOnTop: (on: boolean) => send("window:set-always-on-top", on),
  },

  island: {
    resize: (width: number, height: number) =>
      send(IPC_CHANNELS.ISLAND_RESIZE, { width, height }),
    pin: (pinned: boolean) => send(IPC_CHANNELS.ISLAND_PIN_TOGGLE, { pinned }),
  },

  settings: {
    get: () => invoke<import("../src/types").Settings>(IPC_CHANNELS.SETTINGS_REQUEST),
    update: (settings: import("../src/types").Settings) =>
      send(IPC_CHANNELS.SETTINGS_UPDATED, settings),
  },

  startup: {
    set: (on: boolean) =>
      invoke<boolean>("startup:set", on),
    get: () => invoke<boolean>("startup:get"),
  },

  admin: {
    status: () => invoke<boolean>("admin:status"),
    onError: (cb: (data: { message: string; feature?: string }) => void) =>
      on(IPC_CHANNELS.SYSTEM_ERROR, cb as Listener),
  },
});
