import React, { memo } from "react";
import { motion } from "framer-motion";
import { useIslandStore } from "../store/islandStore";
import { springPresets } from "../animations/springs";

const VolumeWidget = memo(function VolumeWidget() {
  const volume = useIslandStore((s) => s.volume);
  const setVolume = useIslandStore((s) => s.setVolume);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const pct = Math.round(volume.level * 100);
  const muted = volume.muted || volume.level === 0;

  const onSlide = (raw: number) => {
    const level = raw / 100;
    setVolume({
      level,
      muted: false,
      isChanging: true,
      previousLevel: volume.previousLevel,
    });
    window.api.volume.setLevel(level);
  };

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
      <button
        onClick={() => window.api.volume.toggleMute()}
        className="flex-shrink-0 -ml-1"
        aria-label="Toggle mute"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={muted ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.85)"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {muted ? (
            <>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="22" y1="9" x2="16" y2="15" />
              <line x1="16" y1="9" x2="22" y2="15" />
            </>
          ) : volume.level < 0.5 ? (
            <>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 010 7.07" />
            </>
          ) : (
            <>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 010 7.07" />
              <path d="M19.07 4.93a10 10 0 010 14.14" />
            </>
          )}
        </svg>
      </button>
      <div className="flex-1 relative h-6 flex items-center">
        <div className="relative w-full h-[3px] rounded-full bg-white/10 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: muted
                ? "rgba(255,255,255,0.35)"
                : "rgba(255,255,255,0.95)",
            }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          onChange={(e) => onSlide(Number(e.target.value))}
          onMouseUp={() => setVolume({ ...volume, isChanging: false })}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          aria-label="Volume"
        />
      </div>
      <span className="tabular text-white/60 text-[11px] w-9 text-right">
        {pct}%
      </span>
    </motion.div>
  );
});

export default VolumeWidget;
