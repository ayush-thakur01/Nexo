/// <reference types="vite/client" />

import type { Settings } from "./types";

declare global {
  interface Window {
    api: {
    on: (channel: string, callback: (data: unknown) => void) => () => void;
    off: (channel: string, callback: (data: unknown) => void) => void;
    send: (channel: string, data?: unknown) => void;
    invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<T>;
    volume: {
      onChange: (
        cb: (data: {
          level: number;
          muted: boolean;
          previousLevel?: number;
        }) => void,
      ) => () => void;
      setLevel: (level: number) => void;
      toggleMute: () => void;
    };
    media: {
      onChange: (cb: (data: unknown) => void) => () => void;
      playPause: () => void;
      next: () => void;
      previous: () => void;
      stop: () => void;
    };
    notification: {
      onReceive: (cb: (data: unknown) => void) => () => void;
    };
    battery: {
      onChange: (
        cb: (data: {
          level: number;
          charging: boolean;
          status: string;
          minutesRemaining?: number;
        }) => void,
      ) => () => void;
    };
    devices: {
      onChange: (
        cb: (data: { micActive: boolean; cameraActive: boolean }) => void,
      ) => () => void;
    };
    network: {
      onChange: (cb: (data: unknown) => void) => () => void;
      onSpeed: (
        cb: (data: {
          downBps: number;
          upBps: number;
          adapter: string;
          ipv4?: string;
        }) => void,
      ) => () => void;
    };
    quickControls: {
      onCapabilities: (cb: (data: unknown) => void) => () => void;
      onBrightness: (
        cb: (data: {
          level: number;
          supported: boolean;
          error?: string;
        }) => void,
      ) => () => void;
      setBrightness: (level: number) => void;
      onBluetoothDevices: (cb: (data: unknown) => void) => () => void;
      refreshBluetoothDevices: () => void;
      onNightLight: (cb: (data: unknown) => void) => () => void;
      setNightLight: (enabled: boolean) => void;
      onFocus: (cb: (data: unknown) => void) => () => void;
      setFocus: (enabled: boolean) => void;
      onWifiNetworks: (cb: (data: unknown) => void) => () => void;
      scanWifi: () => void;
      disconnectWifi: () => void;
      toggleWifi: () => void;
      toggleBluetooth: () => void;
      toggleAirplane: () => void;
      onHealth: (cb: (data: unknown) => void) => () => void;
      onClipboard: (cb: (data: unknown) => void) => () => void;
    };

    window: {
      show: () => void;
      hide: () => void;
      toggle: () => void;
      quit: () => void;
      setAlwaysOnTop: (on: boolean) => void;
    };
    island: {
      resize: (width: number, height: number) => void;
      pin: (pinned: boolean) => void;
    };
    settings: {
      get: () => Promise<Settings>;
      update: (settings: Settings) => void;
    };
    startup: {
      set: (on: boolean) => Promise<boolean>;
      get: () => Promise<boolean>;
    };
    admin: {
      status: () => Promise<boolean>;
      onError: (
        cb: (data: { message: string; feature?: string }) => void,
      ) => () => void;
    };
  };
  }
}
