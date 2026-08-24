import React from "react";
import { motion } from "framer-motion";
import { useIslandStore } from "../store/islandStore";
import { truncateText } from "../utils/helpers";

const DownloadWidget: React.FC = () => {
  const downloads = useIslandStore((s) => s.downloads);
  const removeDownload = useIslandStore((s) => s.removeDownload);
  const latest = downloads[0];

  if (!latest) return null;

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
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold truncate">
          Download Complete
        </p>
        <p className="text-white/50 text-[10px] truncate">
          {truncateText(latest.filename, 25)}
        </p>
      </div>
      <motion.button
        className="text-white/30 hover:text-white/60 text-xs flex-shrink-0"
        onClick={() => removeDownload(latest.id)}
        whileTap={{ scale: 0.8 }}
      >
        &#x2715;
      </motion.button>
    </div>
  );
};

export default DownloadWidget;
