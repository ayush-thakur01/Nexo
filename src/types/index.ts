export interface NotificationData {
  id: string;
  appName: string;
  appIcon?: string;
  title: string;
  body: string;
  timestamp: number;
  persistent: boolean;
  category: string;
  actions: NotificationAction[];
}

export interface NotificationAction {
  type: "button" | "input";
  id: string;
  title: string;
}

export interface MediaMetadata {
  title: string;
  artist: string;
  album: string;
  artwork?: string;
  duration: number;
  position: number;
  playbackRate: number;
  state: "playing" | "paused" | "stopped" | "loading";
  source?: string;
}

export interface VolumeState {
  level: number;
  muted: boolean;
  isChanging: boolean;
  previousLevel: number;
}

export interface BatteryState {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  status: "full" | "charging" | "discharging" | "notPresent";
  minutesRemaining: number;
}

export interface BrightnessState {
  value: number;
  supported: boolean;
  error?: string;
}

export interface ClipboardData {
  type: "text" | "image" | "html";
  preview?: string;
  timestamp: number;
}

export interface DownloadItem {
  id: string;
  filename: string;
  path: string;
  size: number;
  completed: boolean;
  timestamp: number;
}

export interface ScreenshotData {
  id: string;
  path: string;
  timestamp: number;
}

export interface SensorState {
  micActive: boolean;
  cameraActive: boolean;
}

export interface NetworkState {
  wifiConnected: boolean;
  wifiSSID: string;
  wifiSignal: number;
  wifiEnabled: boolean;
  bluetooth: boolean;
  bluetoothEnabled: boolean;
  airplaneMode: boolean;
  vpnConnected: boolean;
  internetAvailable: boolean;
  connectionType: "none" | "wifi" | "ethernet" | "vpn" | "hotspot";
  ipv4?: string;
  ipv6?: string;
  latencyMs?: number;
}

export interface NetworkSpeed {
  downBps: number;
  upBps: number;
  adapter: string;
  ipv4?: string;
  totalDownBytes: number;
  totalUpBytes: number;
}

export interface SystemHealth {
  cpuPercent: number;
  memPercent: number;
  memUsedGB: number;
  memTotalGB: number;
  diskFreeGB: number;
  diskTotalGB: number;
  diskPercent: number;
  uptimeMinutes: number;
}

export interface SystemCapabilities {
  isAdmin: boolean;
  brightnessSupported: boolean;
  nightLightSupported: boolean;
  focusAssistSupported: boolean;
  airplaneToggleSupported: boolean;
  wifiToggleSupported: boolean;
  bluetoothToggleSupported: boolean;
  note: string;
}

export interface QuickControlsState {
  capabilities: SystemCapabilities | null;
  nightLight: { enabled: boolean; supported: boolean; error?: string } | null;
  focus: { enabled: boolean; supported: boolean; error?: string } | null;
  health: SystemHealth | null;
  speed: NetworkSpeed | null;
}

export interface BluetoothDevice {
  id: string;
  name: string;
  connected: boolean;
}

export interface WifiNetwork {
  ssid: string;
  signal: number;
  security: string;
}

export interface Settings {
  startOnBoot: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
  animationSpeed: number;
  notificationTimeout: number;
  transparency: number;
  blurIntensity: number;
  cornerRadius: number;
  alwaysOnTop: boolean;
  soundEffects: boolean;
  pinned: boolean;
  enableNotifications: boolean;
  enableMediaControls: boolean;
  enableVolume: boolean;
  enableBrightness: boolean;
  enableBattery: boolean;
  enableClipboard: boolean;
  enableDownloads: boolean;
  enableScreenshot: boolean;
  enableMicrophoneIndicator: boolean;
  enableAIAssistant: boolean;
}

export interface IslandState {
  isExpanded: boolean;
  isVisible: boolean;
  isHovered: boolean;
  currentWidget: WidgetType | null;
  width: number;
  height: number;
  pinned: boolean;
  lastWidget?: WidgetType | null;
}

export type WidgetType =
  | "idle"
  | "notification"
  | "media"
  | "volume"
  | "brightness"
  | "battery"
  | "clipboard"
  | "download"
  | "screenshot"
  | "ai"
  | "mic"
  | "network";

export interface IslandPosition {
  x: number;
  y: number;
}

export interface QueueItem {
  id: string;
  type: WidgetType;
  data: unknown;
  timestamp: number;
}
