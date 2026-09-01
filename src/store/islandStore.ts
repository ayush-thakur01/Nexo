import { create } from "zustand";
import {
  Settings,
  IslandState,
  NotificationData,
  MediaMetadata,
  VolumeState,
  BatteryState,
  BrightnessState,
  ClipboardData,
  DownloadItem,
  ScreenshotData,
  SensorState,
  NetworkState,
  QueueItem,
  WidgetType,
  QuickControlsState,
  SystemCapabilities,
  BluetoothDevice,
  WifiNetwork,
  SystemHealth,
  NetworkSpeed,
} from "../types";

interface AppState {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;

  island: IslandState;
  setIslandState: (state: Partial<IslandState>) => void;

  notifications: NotificationData[];
  addNotification: (notification: NotificationData) => void;
  removeNotification: (id: string) => void;

  mediaMetadata: MediaMetadata | null;
  setMediaMetadata: (metadata: MediaMetadata | null) => void;

  /** Live playback position, decoupled from the static metadata so a once-a-
   *  second position heartbeat never re-renders the whole media widget. */
  mediaPosition: number;
  setMediaPosition: (position: number) => void;

  /** Whether the compact media pill is user-expanded into the full controls view. */
  mediaExpanded: boolean;
  setMediaExpanded: (expanded: boolean) => void;

  volume: VolumeState;
  setVolume: (volume: VolumeState) => void;

  battery: BatteryState;
  setBattery: (battery: BatteryState) => void;

  brightness: BrightnessState;
  setBrightness: (brightness: BrightnessState) => void;

  clipboard: ClipboardData | null;
  setClipboard: (data: ClipboardData | null) => void;

  downloads: DownloadItem[];
  addDownload: (item: DownloadItem) => void;
  removeDownload: (id: string) => void;

  screenshots: ScreenshotData[];
  addScreenshot: (screenshot: ScreenshotData) => void;

  sensors: SensorState;
  setSensors: (sensors: SensorState) => void;

  network: NetworkState;
  setNetwork: (network: NetworkState) => void;

  speed: NetworkSpeed;
  setSpeed: (speed: NetworkSpeed) => void;

  quickControls: QuickControlsState;
  setCapabilities: (capabilities: SystemCapabilities) => void;
  setNightLight: (state: {
    enabled: boolean;
    supported: boolean;
    error?: string;
  }) => void;
  setFocus: (state: {
    enabled: boolean;
    supported: boolean;
    error?: string;
  }) => void;
  setHealth: (health: SystemHealth) => void;

  bluetoothDevices: BluetoothDevice[];
  setBluetoothDevices: (devices: BluetoothDevice[]) => void;

  availableNetworks: WifiNetwork[];
  setAvailableNetworks: (networks: WifiNetwork[]) => void;

  queue: QueueItem[];
  enqueue: (item: QueueItem) => void;
  dequeue: () => QueueItem | undefined;
  clearQueue: () => void;

  currentWidget: WidgetType | null;
  setCurrentWidget: (widget: WidgetType | null) => void;

  isAIPanelOpen: boolean;
  setAIPanelOpen: (open: boolean) => void;

  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;

  isInitialized: boolean;
  setInitialized: (val: boolean) => void;

  isContextMenuOpen: boolean;
  setContextMenuOpen: (open: boolean) => void;

  isQuickControlsOpen: boolean;
  setQuickControlsOpen: (open: boolean) => void;

  clock: string;
  setClock: (time: string) => void;

  // Timers / stopwatches (renderer-side real time)
  pomodoro: {
    running: boolean;
    endsAt: number | null;
    remainingSec: number;
    mode: "work" | "break";
  };
  setPomodoro: (next: Partial<AppState["pomodoro"]>) => void;

  stopwatch: {
    running: boolean;
    startedAt: number | null;
    accumulatedMs: number;
  };
  setStopwatch: (next: Partial<AppState["stopwatch"]>) => void;
}

const defaultSettings: Settings = {
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

export const useIslandStore = create<AppState>((set) => ({
  settings: defaultSettings,

  updateSetting: (key, value) =>
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    })),
  resetSettings: () => set(() => ({ settings: { ...defaultSettings } })),

  island: {
    isExpanded: false,
    isVisible: true,
    isHovered: false,
    currentWidget: null,
    width: 260,
    height: 42,
    pinned: false,
  },
  setIslandState: (partial) =>
    set((state) => ({ island: { ...state.island, ...partial } })),

  notifications: [],
  addNotification: (notification) =>
    set((state) => {
      const next = [...state.notifications, notification];
      if (next.length > 5) next.shift();
      return { notifications: next };
    }),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  mediaMetadata: null,
  setMediaMetadata: (metadata) => set(() => ({ mediaMetadata: metadata })),

  mediaPosition: 0,
  setMediaPosition: (position) => set(() => ({ mediaPosition: position })),

  mediaExpanded: false,
  setMediaExpanded: (expanded) => set(() => ({ mediaExpanded: expanded })),

  volume: { level: 0.5, muted: false, isChanging: false, previousLevel: 0.5 },
  setVolume: (volume) => set(() => ({ volume })),

  battery: {
    level: 100,
    charging: false,
    chargingTime: 0,
    dischargingTime: 0,
    status: "full",
    minutesRemaining: -1,
  },
  setBattery: (battery) => set(() => ({ battery })),

  brightness: { value: 0.5, supported: false },
  setBrightness: (brightness) => set(() => ({ brightness })),

  clipboard: null,
  setClipboard: (data) => set(() => ({ clipboard: data })),

  downloads: [],
  addDownload: (item) =>
    set((state) => {
      const next = [item, ...state.downloads];
      if (next.length > 20) next.pop();
      return { downloads: next };
    }),
  removeDownload: (id) =>
    set((state) => ({
      downloads: state.downloads.filter((d) => d.id !== id),
    })),

  screenshots: [],
  addScreenshot: (screenshot) =>
    set((state) => {
      const next = [screenshot, ...state.screenshots];
      if (next.length > 10) next.pop();
      return { screenshots: next };
    }),

  sensors: { micActive: false, cameraActive: false },
  setSensors: (sensors) => set(() => ({ sensors })),

  network: {
    wifiConnected: false,
    wifiSSID: "",
    wifiSignal: 0,
    wifiEnabled: false,
    bluetooth: false,
    bluetoothEnabled: false,
    airplaneMode: false,
    vpnConnected: false,
    internetAvailable: false,
    connectionType: "none",
  },
  setNetwork: (network) => set(() => ({ network })),

  speed: {
    downBps: 0,
    upBps: 0,
    adapter: "",
    totalDownBytes: 0,
    totalUpBytes: 0,
  },
  setSpeed: (speed) => set(() => ({ speed })),

  quickControls: {
    capabilities: null,
    nightLight: null,
    focus: null,
    health: null,
    speed: null,
  },
  setCapabilities: (capabilities) =>
    set((state) => ({
      quickControls: { ...state.quickControls, capabilities },
    })),
  setNightLight: (nightLight) =>
    set((state) => ({ quickControls: { ...state.quickControls, nightLight } })),
  setFocus: (focus) =>
    set((state) => ({ quickControls: { ...state.quickControls, focus } })),
  setHealth: (health) =>
    set((state) => ({ quickControls: { ...state.quickControls, health } })),

  bluetoothDevices: [],
  setBluetoothDevices: (devices) => set(() => ({ bluetoothDevices: devices })),

  availableNetworks: [],
  setAvailableNetworks: (networks) =>
    set(() => ({ availableNetworks: networks })),

  queue: [],
  enqueue: (item) => set((state) => ({ queue: [...state.queue, item] })),
  dequeue: () => {
    let result: QueueItem | undefined;
    set((state) => {
      if (state.queue.length > 0) {
        result = state.queue[0];
        return { queue: state.queue.slice(1) };
      }
      return {};
    });
    return result;
  },
  clearQueue: () => set(() => ({ queue: [] })),

  currentWidget: null,
  setCurrentWidget: (widget) => set(() => ({ currentWidget: widget })),

  isSettingsOpen: false,
  setSettingsOpen: (open) => set(() => ({ isSettingsOpen: open })),

  isAIPanelOpen: false,
  setAIPanelOpen: (open) => set(() => ({ isAIPanelOpen: open })),

  isContextMenuOpen: false,
  setContextMenuOpen: (open) => set(() => ({ isContextMenuOpen: open })),

  isQuickControlsOpen: false,
  setQuickControlsOpen: (open) => set(() => ({ isQuickControlsOpen: open })),

  clock: "",
  setClock: (clock) => set(() => ({ clock })),

  isInitialized: false,
  setInitialized: (val) => set(() => ({ isInitialized: val })),

  pomodoro: {
    running: false,
    endsAt: null,
    remainingSec: 25 * 60,
    mode: "work",
  },
  setPomodoro: (next) =>
    set((state) => ({ pomodoro: { ...state.pomodoro, ...next } })),

  stopwatch: { running: false, startedAt: null, accumulatedMs: 0 },
  setStopwatch: (next) =>
    set((state) => ({ stopwatch: { ...state.stopwatch, ...next } })),
}));
