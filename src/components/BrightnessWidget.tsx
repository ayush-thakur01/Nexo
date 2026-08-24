import React, { memo } from "react";
import { motion } from "framer-motion";
import { useIslandStore } from "../store/islandStore";
import { springPresets } from "../animations/springs";

const BrightnessWidget = memo(function BrightnessWidget() {
  const brightness = useIslandStore((s) => s.brightness);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  if (!brightness.supported) {
    return (
      <motion.div
        className="flex items-center gap-3 h-full px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={springPresets.quick}
        onMouseDown={stop}
        onMouseUp={stop}
        onClick={stop}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          className="flex-shrink-0"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
        <p className="text-white/70 text-[12px] flex-1">
          This display does not support software brightness control.
        </p>
      </motion.div>
    );
  }

  const pct = Math.round(brightness.value * 100);

  return (
    <motion.div
      className="flex items-center gap-3 h-full px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={springPresets.quick}
      onMouseDown={stop}
      onMouseUp={stop}
      onClick={stop}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="2"
        className="flex-shrink-0"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      <div className="flex-1 relative h-6 flex items-center">
        <div className="relative w-full h-[3px] rounded-full bg-white/10 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
            }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          onChange={(e) =>
            window.api.quickControls.setBrightness(Number(e.target.value))
          }
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          aria-label="Brightness"
        />
      </div>
      <span className="tabular text-white/60 text-[11px] w-9 text-right">
        {pct}%
      </span>
    </motion.div>
  );
});

export default BrightnessWidget;
