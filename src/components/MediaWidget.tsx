import React, { memo } from "react";
import { motion } from "framer-motion";
import { useIslandStore } from "../store/islandStore";
import { truncateText } from "../utils/helpers";

const formatTime = (sec: number): string => {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// Any interaction inside the pill that should NOT collapse/expand the island
// (taps on transport controls) stops propagation and runs its action directly.
const stop = (e: React.SyntheticEvent) => {
  e.stopPropagation();
  e.preventDefault();
};

const ControlButton = ({
  label,
  onClick,
  children,
  primary,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  primary?: boolean;
}) => (
  <motion.button
    aria-label={label}
    title={label}
    className={
      primary
        ? "w-10 h-10 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0"
        : "w-9 h-9 rounded-full text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center flex-shrink-0 transition-colors"
    }
    onPointerDown={stop}
    onClick={(e) => {
      stop(e);
      onClick();
    }}
    whileTap={{ scale: 0.86 }}
  >
    {children}
  </motion.button>
);

const PlayPauseIcon = ({ playing }: { playing: boolean }) =>
  playing ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 5v14l12-7z" />
    </svg>
  );

const MediaWidget = memo(function MediaWidget() {
  const metadata = useIslandStore((s) => s.mediaMetadata);
  const mediaPosition = useIslandStore((s) => s.mediaPosition);
  const mediaExpanded = useIslandStore((s) => s.mediaExpanded);
  const setMediaExpanded = useIslandStore((s) => s.setMediaExpanded);

  if (!metadata) return null;

  const pct =
    metadata.duration > 0
      ? Math.min(100, Math.max(0, (mediaPosition / metadata.duration) * 100))
      : 0;
  const playing = metadata.state === "playing";

  const toggleExpand = () => setMediaExpanded(!mediaExpanded);

  // --- Compact pill -------------------------------------------------------
  if (!mediaExpanded) {
    return (
      <button
        className="flex items-center gap-3 w-full h-full px-3 outline-none"
        onClick={toggleExpand}
        aria-label="Expand media controls"
      >
        {metadata.artwork ? (
          <img
            src={metadata.artwork}
            alt=""
            className="w-7 h-7 rounded-[7px] object-cover flex-shrink-0"
            draggable={false}
          />
        ) : (
          <div
            className="w-7 h-7 rounded-[7px] flex-shrink-0 flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        )}
        <span className="flex-1 min-w-0 text-left text-white text-[12px] font-semibold truncate leading-tight">
          {truncateText(metadata.title, 30)}
        </span>
        {!playing && metadata.state !== "stopped" && (
          <span className="text-white/45 text-[10px] uppercase tracking-wide flex-shrink-0">
            paused
          </span>
        )}
        <ControlButton
          label={playing ? "Pause" : "Play"}
          onClick={window.api.media.playPause}
        >
          <PlayPauseIcon playing={playing} />
        </ControlButton>
      </button>
    );
  }

  // --- Expanded full controls ---------------------------------------------
  return (
    <div
      className="flex items-center gap-4 w-full h-full px-5"
      onPointerDown={stop}
      onClick={toggleExpand}
    >
      {metadata.artwork ? (
        <img
          src={metadata.artwork}
          alt=""
          className="w-20 h-20 rounded-[14px] object-cover flex-shrink-0"
          draggable={false}
        />
      ) : (
        <div
          className="w-20 h-20 rounded-[14px] flex-shrink-0 flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col justify-center h-full py-4">
        <p className="text-white text-[13px] font-semibold truncate leading-tight">
          {truncateText(metadata.title, 34)}
        </p>
        <p className="text-white/55 text-[11px] truncate leading-tight mt-0.5">
          {metadata.artist ? truncateText(`${metadata.artist}${metadata.album ? " — " + metadata.album : ""}`, 48) : (metadata.album || "")}
        </p>

        <div className="flex items-center gap-3 mt-3">
          <span className="tabular text-white/40 text-[10px] w-[34px] text-right flex-shrink-0">
            {formatTime(mediaPosition)}
          </span>
          <div className="flex-1 h-[3px] bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "rgba(255,255,255,0.9)",
                width: `${pct}%`,
                transition: "none",
              }}
            />
          </div>
          <span className="tabular text-white/40 text-[10px] w-[34px] flex-shrink-0">
            {formatTime(metadata.duration)}
          </span>
        </div>

        <div className="flex items-center justify-center gap-2 mt-3">
          <ControlButton label="Previous" onClick={window.api.media.previous}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </ControlButton>
          <ControlButton
            label={playing ? "Pause" : "Play"}
            onClick={window.api.media.playPause}
            primary
          >
            <PlayPauseIcon playing={playing} />
          </ControlButton>
          <ControlButton label="Next" onClick={window.api.media.next}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </ControlButton>
          <ControlButton label="Stop" onClick={window.api.media.stop}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <rect x="5" y="5" width="14" height="14" rx="2" />
            </svg>
          </ControlButton>
        </div>
      </div>
    </div>
  );
});

MediaWidget.displayName = "MediaWidget";

export default MediaWidget;