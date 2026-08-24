import React, { memo, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useIslandStore } from "../store/islandStore";
import { springPresets } from "../animations/springs";
import ControlToggle from "./ControlToggle";

const WifiIcon = ({ active }: { active: boolean }) => (
  <svg
    width="16"
    height="14"
    viewBox="0 0 24 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M5 12.55a11 11 0 0114.08 0" />
    <path d="M1.42 9a16 16 0 0121.16 0" />
    <path d="M8.53 16.11a6 6 0 016.95 0" />
    <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const BluetoothIcon = ({ active }: { active: boolean }) => (
  <svg
    width="13"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 7 18 13 12 18 12 2 18 7 6 13" />
  </svg>
);
const MoonIcon = ({ active }: { active: boolean }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);
const MuteIcon = ({ active }: { active: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    {active && <path d="M22 9l-6 6M16 9l6 6" />}
  </svg>
);
const VolumeIcon = ({ active }: { active: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    <path d="M15.54 8.46a5 5 0 010 7.07" />
  </svg>
);
const SunIcon = ({ active }: { active: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);
const BellOffIcon = ({ active }: { active: boolean }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M13.73 21a2 2 0 01-3.46 0" />
    <path d="M18.63 13A17.89 17.89 0 0118 8" />
    <path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14" />
    <path d="M18 8a6 6 0 00-9.33-5" />
    <path d="M1 1l22 22" />
  </svg>
);
const NightIcon = ({ active }: { active: boolean }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 18a5 5 0 00-10 0" />
    <path d="M12 2a7 7 0 010 14c-1.2 0-2.3-.3-3.3-.8" />
  </svg>
);
const PlaneIcon = ({ active }: { active: boolean }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
  </svg>
);
const SparklesIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3l1.6 4.2L18 9l-4.4 1.8L12 15l-1.6-4.2L6 9l4.4-1.8z" />
    <path d="M19 14l.8 2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-1z" />
  </svg>
);

interface SliderProps {
  value: number;
  max?: number;
  onChange: (v: number) => void;
  accent?: string;
  disabled?: boolean;
}

const Slider: React.FC<SliderProps> = memo(function Slider({
  value,
  max = 100,
  onChange,
  accent = "#ffffff",
  disabled,
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className="relative w-full h-6 flex items-center group"
      aria-disabled={disabled}
    >
      <div className="relative w-full h-[3px] rounded-full bg-white/10 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: disabled ? "rgba(255,255,255,0.18)" : accent,
          }}
        />
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
    </div>
  );
});

const Metric: React.FC<{
  label: string;
  value: string;
  pct?: number;
  accent?: string;
}> = ({ label, value, pct, accent = "rgba(255,255,255,0.85)" }) => (
  <div className="px-2.5 py-2 rounded-xl bg-white/[0.04]">
    <div className="flex items-center justify-between">
      <span className="text-white/50 text-[10px] uppercase tracking-wider">
        {label}
      </span>
      <span className="tabular text-white/85 text-[11px] font-medium">
        {value}
      </span>
    </div>
    {typeof pct === "number" && (
      <div className="mt-1.5 h-[3px] bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(0, Math.min(100, pct))}%`,
            background: accent,
          }}
        />
      </div>
    )}
  </div>
);

const formatBytesShort = (bytes: number): string => {
  if (!bytes) return "0 B";
  const k = 1024;
  if (bytes >= k * k * k) return `${(bytes / (k * k * k)).toFixed(1)} GB`;
  if (bytes >= k * k) return `${(bytes / (k * k)).toFixed(1)} MB`;
  if (bytes >= k) return `${(bytes / k).toFixed(0)} KB`;
  return `${bytes} B`;
};

const formatUptime = (min: number): string => {
  if (!min || min < 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};

const QuickControlsPanel: React.FC<{ onClose: () => void }> = memo(
  function QuickControlsPanel({ onClose }) {
    const volume = useIslandStore((s) => s.volume);
    const battery = useIslandStore((s) => s.battery);
    const network = useIslandStore((s) => s.network);
    const speed = useIslandStore((s) => s.speed);
    const quickControls = useIslandStore((s) => s.quickControls);
    const bluetoothDevices = useIslandStore((s) => s.bluetoothDevices);
    const availableNetworks = useIslandStore((s) => s.availableNetworks);
    const settings = useIslandStore((s) => s.settings);
    const updateSetting = useIslandStore((s) => s.updateSetting);
    const setAIPanelOpen = useIslandStore((s) => s.setAIPanelOpen);

    const caps = quickControls.capabilities;
    const nightLight = quickControls.nightLight;
    const focus = quickControls.focus;
    const health = quickControls.health;

    const [localVolume, setLocalVolume] = useState(volume.level * 100);
    const [brightness, setBrightnessState] = useState(50);

    useEffect(() => {
      setLocalVolume(volume.level * 100);
    }, [volume.level]);

    useEffect(() => {
      const unsub = window.api.quickControls.onBrightness((data) =>
        setBrightnessState(data.level),
      );
      return () => unsub();
    }, []);

    const handleVolume = useCallback((v: number) => {
      setLocalVolume(v);
      window.api.volume.setLevel(v / 100);
    }, []);
    const handleBrightness = useCallback((v: number) => {
      setBrightnessState(v);
      window.api.quickControls.setBrightness(v);
    }, []);
    const toggleDarkMode = useCallback(
      () =>
        updateSetting("theme", settings.theme === "dark" ? "light" : "dark"),
      [settings.theme, updateSetting],
    );

    const isDark = settings.theme === "dark";
    const nightLightOn = nightLight?.enabled ?? false;
    const nightLightEnabled = nightLight?.supported ?? false;
    const focusOn = focus?.enabled ?? false;
    const focusEnabled = focus?.supported ?? false;
    const brightnessSupported = caps?.brightnessSupported ?? true;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={springPresets.bouncy}
        className="w-full h-full overflow-y-auto px-4 py-3"
        onClick={(e) => e.stopPropagation()}
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-white/90 text-[13px] font-semibold">
              Quick Controls
            </span>
            <span className="text-white/35 text-[10px] tabular">·</span>
            <button
              onClick={() => setAIPanelOpen(true)}
              className="flex items-center gap-1 text-white/70 hover:text-white transition-colors"
              aria-label="Open AI assistant"
            >
              <SparklesIcon />
              <span className="text-[11px]">Ask AI</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-colors"
            aria-label="Close quick controls"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <ControlToggle
            label="Wi-Fi"
            icon={<WifiIcon active={network.wifiEnabled} />}
            active={network.wifiEnabled}
            enabled={caps?.wifiToggleSupported ?? false}
            note={
              caps?.wifiToggleSupported
                ? network.wifiEnabled
                  ? "Turn off Wi-Fi"
                  : "Turn on Wi-Fi"
                : "Requires administrator"
            }
            onToggle={() => window.api.quickControls.toggleWifi()}
          />
          <ControlToggle
            label="Bluetooth"
            icon={<BluetoothIcon active={network.bluetoothEnabled} />}
            active={network.bluetoothEnabled}
            enabled={caps?.bluetoothToggleSupported ?? false}
            note={
              caps?.bluetoothToggleSupported
                ? network.bluetoothEnabled
                  ? "Turn off Bluetooth"
                  : "Turn on Bluetooth"
                : "Not supported"
            }
            onToggle={() => window.api.quickControls.toggleBluetooth()}
          />
          <ControlToggle
            label="Dark Mode"
            icon={<MoonIcon active={isDark} />}
            active={isDark}
            onToggle={toggleDarkMode}
          />
          <ControlToggle
            label="Mute"
            icon={<MuteIcon active={volume.muted} />}
            active={volume.muted}
            onToggle={() => window.api.volume.toggleMute()}
          />
          <ControlToggle
            label="Volume"
            icon={<VolumeIcon active={volume.level > 0} />}
            active={volume.level > 0}
            onToggle={() => handleVolume(volume.level > 0 ? 0 : 50)}
          />
          <ControlToggle
            label="Brightness"
            icon={<SunIcon active={brightness > 20} />}
            active={brightness > 20}
            enabled={brightnessSupported}
            note={
              brightnessSupported
                ? "Adjust brightness"
                : "Unsupported on this display"
            }
            onToggle={() => handleBrightness(brightness > 20 ? 15 : 60)}
          />
          <ControlToggle
            label="DND"
            icon={<BellOffIcon active={focusOn} />}
            active={focusOn}
            enabled={focusEnabled}
            note={
              focusEnabled
                ? "Do Not Disturb"
                : (focus?.error ?? "Requires native support")
            }
            onToggle={() => window.api.quickControls.setFocus(!focusOn)}
          />
          <ControlToggle
            label="Night Light"
            icon={<NightIcon active={nightLightOn} />}
            active={nightLightOn}
            enabled={nightLightEnabled}
            note={
              nightLightEnabled
                ? "Night Light"
                : (nightLight?.error ?? "Requires native support")
            }
            onToggle={() =>
              window.api.quickControls.setNightLight(!nightLightOn)
            }
          />
          <ControlToggle
            label="Airplane"
            icon={<PlaneIcon active={network.airplaneMode} />}
            active={network.airplaneMode}
            enabled={caps?.airplaneToggleSupported ?? false}
            note="Requires native WinRT radio manager"
            onToggle={() => window.api.quickControls.toggleAirplane()}
          />
        </div>

        <div className="space-y-3 mb-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/55 text-[10px] font-medium uppercase tracking-wider">
                Volume
              </span>
              <span className="tabular text-white/70 text-[10px]">
                {Math.round(localVolume)}%
              </span>
            </div>
            <Slider
              value={localVolume}
              max={100}
              onChange={handleVolume}
              accent="rgba(255,255,255,0.95)"
            />
          </div>
          {brightnessSupported && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/55 text-[10px] font-medium uppercase tracking-wider">
                  Brightness
                </span>
                <span className="tabular text-white/70 text-[10px]">
                  {Math.round(brightness)}%
                </span>
              </div>
              <Slider
                value={brightness}
                max={100}
                onChange={handleBrightness}
                accent="#fbbf24"
              />
            </div>
          )}
        </div>

        {health && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Metric
              label="CPU"
              value={`${health.cpuPercent}%`}
              pct={health.cpuPercent}
              accent="#60a5fa"
            />
            <Metric
              label="Memory"
              value={`${health.memPercent}%`}
              pct={health.memPercent}
              accent="#a78bfa"
            />
            <Metric
              label="Disk"
              value={`${health.diskFreeGB} GB free`}
              pct={health.diskPercent}
              accent="#34d399"
            />
            <Metric label="Uptime" value={formatUptime(health.uptimeMinutes)} />
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-white/[0.04]">
            <div>
              <p className="text-white/85 text-[12px] font-medium">Battery</p>
              {battery.minutesRemaining > 0 && !battery.charging && (
                <p className="text-white/45 text-[10px]">
                  {formatUptime(battery.minutesRemaining)} remaining
                </p>
              )}
            </div>
            <span
              className={`tabular text-[12px] font-medium ${battery.charging ? "text-emerald-400" : battery.level <= 20 ? "text-red-400" : "text-white/85"}`}
            >
              {battery.level}%{battery.charging ? " · Charging" : ""}
            </span>
          </div>
          <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-white/[0.04]">
            <div>
              <p className="text-white/85 text-[12px] font-medium">Network</p>
              <p className="text-white/45 text-[10px]">
                {network.connectionType === "wifi"
                  ? "Wi-Fi"
                  : network.connectionType === "ethernet"
                    ? "Ethernet"
                    : network.connectionType === "vpn"
                      ? "VPN"
                      : "Offline"}
                {network.ipv4 ? ` · ${network.ipv4}` : ""}
              </p>
            </div>
            <span className="text-white/85 text-[12px] truncate max-w-[140px]">
              {network.wifiSSID ||
                (network.vpnConnected ? "Connected" : "Not connected")}
            </span>
          </div>
          <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-white/[0.04]">
            <div>
              <p className="text-white/85 text-[12px] font-medium">
                Live throughput
              </p>
              <p className="text-white/45 text-[10px] tabular">
                ↓ {formatBytesShort(speed.downBps)}/s · ↑{" "}
                {formatBytesShort(speed.upBps)}/s
              </p>
            </div>
            <span className="text-white/85 text-[12px] tabular">
              ↓ {(speed.downBps / 1024).toFixed(0)} KB/s
            </span>
          </div>
          {bluetoothDevices.length > 0 && (
            <div className="px-2.5 py-2 rounded-xl bg-white/[0.04]">
              <p className="text-white/55 text-[10px] uppercase tracking-wider mb-1">
                Bluetooth Devices
              </p>
              <div className="flex flex-wrap gap-1">
                {bluetoothDevices.slice(0, 6).map((d) => (
                  <span
                    key={d.id}
                    className="text-[10px] text-white/75 px-1.5 py-0.5 rounded-md bg-white/[0.07] flex items-center gap-1"
                  >
                    {d.connected === true && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    )}
                    {d.name}
                  </span>
                ))}
                {bluetoothDevices.length > 6 && (
                  <span className="text-[10px] text-white/40 px-1.5 py-0.5 rounded-md bg-white/[0.05]">
                    +{bluetoothDevices.length - 6}
                  </span>
                )}
              </div>
            </div>
          )}
          {availableNetworks.length > 0 && (
            <div className="px-2.5 py-2 rounded-xl bg-white/[0.04]">
              <p className="text-white/55 text-[10px] uppercase tracking-wider mb-1">
                Visible networks
              </p>
              <div className="flex flex-wrap gap-1">
                {availableNetworks.slice(0, 6).map((n, i) => (
                  <span
                    key={`${n.ssid}-${i}`}
                    className="text-[10px] text-white/75 px-1.5 py-0.5 rounded-md bg-white/[0.07]"
                  >
                    {n.ssid} · {n.signal}%
                  </span>
                ))}
              </div>
            </div>
          )}
          {caps && !caps.isAdmin && (
            <div className="px-2.5 py-2 rounded-xl bg-amber-500/10 border border-amber-300/15">
              <p className="text-amber-300/85 text-[10px] leading-snug">
                Wi-Fi/Bluetooth toggles require administrator. Relaunch the app
                as admin to enable them.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  },
);

export default QuickControlsPanel;
