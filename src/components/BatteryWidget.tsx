import React, { memo } from "react";
import { motion } from "framer-motion";
import { useIslandStore } from "../store/islandStore";
import { springPresets } from "../animations/springs";

const BatteryWidget = memo(function BatteryWidget() {
  const battery = useIslandStore((s) => s.battery);

  const pct = Math.max(0, Math.min(100, battery.level));
  const fill = battery.charging
    ? "#34d399"
    : pct <= 20
      ? "#f87171"
      : pct <= 50
        ? "#fbbf24"
        : "#34d399";

  return (
    <motion.div
      className="flex items-center gap-3 h-full px-4"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={springPresets.stiff}
    >
      <motion.div
        className="flex-shrink-0"
        animate={battery.charging ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="20" height="12" viewBox="0 0 24 13" fill="none">
          <rect
            x="0.5"
            y="0.5"
            width="20"
            height="12"
            rx="3"
            stroke="rgba(255,255,255,0.32)"
          />
          <rect
            x="21.5"
            y="4"
            width="2"
            height="5"
            rx="1"
            fill="rgba(255,255,255,0.32)"
          />
          <rect
            x="2"
            y="2"
            width={20 * (pct / 100)}
            height="9"
            rx="1.5"
            fill={fill}
          />
          {battery.charging && (
            <path
              d="M12 3l-2 4h2.5l-1.8 4 4-5h-2.4L14 3z"
              fill="#0a0a0f"
              opacity="0.7"
            />
          )}
        </svg>
      </motion.div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between">
          <span className="tabular text-white text-[14px] font-semibold">
            {battery.level}%
          </span>
          <span className="text-white/55 text-[11px]">
            {battery.charging
              ? "Charging"
              : battery.status === "full"
                ? "Full"
                : battery.minutesRemaining > 0
                  ? `${formatMinutes(battery.minutesRemaining)} left`
                  : ""}
          </span>
        </div>
        <div className="mt-1.5 h-[3px] bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: fill,
              transition: "width 600ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
});

function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default BatteryWidget;
