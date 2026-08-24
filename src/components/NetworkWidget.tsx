import React from "react";
import { motion } from "framer-motion";
import { useIslandStore } from "../store/islandStore";
import { springPresets } from "../animations/springs";

const NetworkWidget: React.FC = () => {
  const network = useIslandStore((s) => s.network);

  return (
    <motion.div
      className="flex items-center gap-3 h-full px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={springPresets.quick}
    >
      {network.wifiConnected && (
        <div className="flex items-center gap-1.5">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-white/80"
          >
            <path d="M5 12.55a11 11 0 0114.08 0" />
            <path d="M1.42 9a16 16 0 0121.16 0" />
            <path d="M8.53 16.11a6 6 0 016.95 0" />
            <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
          </svg>
          <span className="text-white/60 text-[10px]">
            {network.wifiSSID || "Wi-Fi"}
          </span>
        </div>
      )}
      {network.bluetooth && (
        <div className="flex items-center gap-1">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-white/60"
          >
            <polyline points="6 7 18 13 12 18 12 2 18 7 6 13" />
          </svg>
          <span className="text-white/40 text-[9px]">BT</span>
        </div>
      )}
      {network.vpnConnected && (
        <div className="flex items-center gap-1">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-green-400"
          >
            <rect x="2" y="2" width="20" height="20" rx="4" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          <span className="text-green-400/60 text-[9px]">VPN</span>
        </div>
      )}
      {network.airplaneMode && (
        <div className="flex items-center gap-1">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-orange-400"
          >
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
          <span className="text-orange-400/60 text-[9px]">Airplane</span>
        </div>
      )}
      {!network.wifiConnected && !network.airplaneMode && (
        <span className="text-white/30 text-[10px]">No Connection</span>
      )}
    </motion.div>
  );
};

export default NetworkWidget;
