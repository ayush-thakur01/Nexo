import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { useIslandStore } from "../store/islandStore";
import { springPresets } from "../animations/springs";

const BatteryIcon: React.FC<{
  level: number;
  charging: boolean;
  size?: number;
}> = ({ level, charging, size = 16 }) => {
  const pct = Math.max(0, Math.min(100, level));
  const fill = charging
    ? "#34d399"
    : pct <= 20
      ? "#f87171"
      : "rgba(255,255,255,0.85)";
  return (
    <svg
      width={size}
      height={(size * 11) / 22}
      viewBox="0 0 22 11"
      fill="none"
      className="flex-shrink-0"
    >
      <rect
        x="0.5"
        y="0.5"
        width="18"
        height="10"
        rx="2.5"
        stroke="rgba(255,255,255,0.32)"
      />
      <rect
        x="2"
        y="2"
        width={(14 * pct) / 100}
        height="7"
        rx="1"
        fill={fill}
      />
      <rect
        x="19.5"
        y="3.5"
        width="2"
        height="4"
        rx="1"
        fill="rgba(255,255,255,0.32)"
      />
      {charging && (
        <path
          d="M10.5 2.5l-1.8 3h2.3l-1.6 3 3.4-4h-2.1l1.4-2z"
          fill="#34d399"
        />
      )}
    </svg>
  );
};

const WifiIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    width="13"
    height="11"
    viewBox="0 0 24 18"
    fill="none"
    stroke={active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.22)"}
    strokeWidth="2.2"
    strokeLinecap="round"
    className="flex-shrink-0"
  >
    <path d="M5 12.55a11 11 0 0114.08 0" />
    <path d="M1.42 9a16 16 0 0121.16 0" />
    <path d="M8.53 16.11a6 6 0 016.95 0" />
    <circle
      cx="12"
      cy="20"
      r="1.2"
      fill={active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.22)"}
      stroke="none"
    />
  </svg>
);

const BluetoothIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.22)"}
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="flex-shrink-0"
  >
    <polyline points="6 7 18 13 12 18 12 2 18 7 6 13" />
  </svg>
);

const Speed: React.FC<{ bytesPerSec: number; color?: string }> = ({
  bytesPerSec,
  color = "rgba(255,255,255,0.85)",
}) => {
  const label = useMemo(() => formatSpeed(bytesPerSec), [bytesPerSec]);
  return (
    <span className="tabular text-[11px] font-medium" style={{ color }}>
      {label}
    </span>
  );
};

function formatSpeed(bps: number): string {
  if (!bps || bps < 1) return "0 KB/s";
  if (bps >= 1024 * 1024)
    return `${(bps / (1024 * 1024)).toFixed(bps >= 1024 * 1024 * 10 ? 0 : 1)} MB/s`;
  if (bps >= 1024) return `${(bps / 1024).toFixed(bps >= 10240 ? 0 : 1)} KB/s`;
  return `${Math.round(bps)} B/s`;
}

const ArrowDown: React.FC<{ color: string }> = ({ color }) => (
  <svg
    width="9"
    height="10"
    viewBox="0 0 12 12"
    fill="none"
    className="flex-shrink-0"
  >
    <path
      d="M6 1v8m0 0l-3-3m3 3l3-3"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowUp: React.FC<{ color: string }> = ({ color }) => (
  <svg
    width="9"
    height="10"
    viewBox="0 0 12 12"
    fill="none"
    className="flex-shrink-0"
  >
    <path
      d="M6 11V3m0 0L3 6m3-3l3 3"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IdleIsland: React.FC = memo(function IdleIsland() {
  const battery = useIslandStore((s) => s.battery);
  const network = useIslandStore((s) => s.network);
  const speed = useIslandStore((s) => s.speed);
  const clock = useIslandStore((s) => s.clock);

  return (
    <motion.div
      className="w-full h-full flex items-center justify-between px-4 select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={springPresets.quick}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <BatteryIcon level={battery.level} charging={battery.charging} />
          <span className="tabular text-white/85 text-[11px] font-medium">
            {battery.level}%
          </span>
        </div>
        <span className="island-divider" />
        <div className="flex items-center gap-2.5">
          <WifiIcon
            active={
              network.wifiConnected || network.connectionType === "ethernet"
            }
          />
          <BluetoothIcon active={network.bluetooth} />
        </div>
        <span className="island-divider" />
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1">
            <ArrowDown color="rgba(255,255,255,0.85)" />
            <Speed bytesPerSec={speed.downBps} />
          </span>
          <span className="flex items-center gap-1">
            <ArrowUp color="rgba(255,255,255,0.55)" />
            <Speed bytesPerSec={speed.upBps} color="rgba(255,255,255,0.55)" />
          </span>
        </div>
      </div>
      <span className="tabular text-white/85 text-[12px] font-semibold">
        {clock || "--:--"}
      </span>
    </motion.div>
  );
});

export default IdleIsland;
