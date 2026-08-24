import React from "react";
import { useIslandStore } from "../store/islandStore";

const ClipboardWidget: React.FC = () => {
  const clipboard = useIslandStore((s) => s.clipboard);

  if (!clipboard) return null;

  return (
    <div className="flex items-center gap-3 h-full px-4">
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-white/60"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="8" y1="16" x2="14" y2="16" />
          <line x1="8" y1="8" x2="10" y2="8" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold">Copied</p>
        <p className="text-white/50 text-[10px] truncate">
          {clipboard.type === "image" ? "Image" : clipboard.preview || ""}
        </p>
      </div>
    </div>
  );
};

export default ClipboardWidget;
