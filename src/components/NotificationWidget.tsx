import React, { memo } from "react";
import { motion } from "framer-motion";
import { useIslandStore } from "../store/islandStore";
import { truncateText } from "../utils/helpers";
import { springPresets } from "../animations/springs";

const NotificationWidget = memo(function NotificationWidget() {
  const notifications = useIslandStore((s) => s.notifications);
  const removeNotification = useIslandStore((s) => s.removeNotification);
  const latest = notifications[notifications.length - 1];

  if (!latest) return null;

  const initials =
    latest.appName
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 2)
      .toUpperCase() || "A";
  const hue = (latest.appName.charCodeAt(0) * 11) % 360;

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <motion.div
      className="flex items-center gap-3 h-full px-4 select-none"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={springPresets.stiff}
      onMouseDown={stop}
      onMouseUp={stop}
      onClick={stop}
    >
      <div
        className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 text-[12px] font-semibold"
        style={{
          background: `linear-gradient(135deg, hsl(${hue}, 70%, 56%), hsl(${(hue + 30) % 360}, 70%, 40%))`,
          color: "rgba(255,255,255,0.96)",
        }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-white/55 text-[10px] font-medium uppercase tracking-wider truncate">
            {latest.appName}
          </p>
          {notifications.length > 1 && (
            <span className="text-white/35 text-[10px] tabular">
              +{notifications.length - 1}
            </span>
          )}
        </div>
        <p className="text-white text-[12.5px] font-semibold truncate leading-tight">
          {latest.title}
        </p>
        {latest.body && (
          <p className="text-white/55 text-[11px] truncate leading-tight mt-0.5">
            {truncateText(latest.body, 60)}
          </p>
        )}
      </div>
      <motion.button
        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors flex-shrink-0"
        onClick={() => removeNotification(latest.id)}
        whileTap={{ scale: 0.85 }}
        aria-label="Dismiss notification"
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
      </motion.button>
    </motion.div>
  );
});

export default NotificationWidget;
