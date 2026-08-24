import React from "react";
import { motion } from "framer-motion";
import { useIslandStore } from "../store/islandStore";

const MicIndicator: React.FC = () => {
  const sensors = useIslandStore((s) => s.sensors);

  if (!sensors.micActive && !sensors.cameraActive) return null;

  return (
    <div className="flex items-center gap-3 h-full px-4">
      {sensors.micActive && (
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2.5 h-2.5 rounded-full bg-orange-500"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-orange-400 text-[10px]">Mic</span>
        </div>
      )}
      {sensors.cameraActive && (
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2.5 h-2.5 rounded-full bg-green-500"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
          <span className="text-green-400 text-[10px]">Camera</span>
        </div>
      )}
    </div>
  );
};

export default MicIndicator;
