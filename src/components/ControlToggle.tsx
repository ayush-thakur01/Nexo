import React, { memo } from "react";
import { motion } from "framer-motion";

interface ControlToggleProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  enabled?: boolean;
  note?: string;
  onToggle: () => void;
}

const ControlToggle: React.FC<ControlToggleProps> = memo(
  function ControlToggle({
    label,
    icon,
    active,
    enabled = true,
    note,
    onToggle,
  }) {
    return (
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => enabled && onToggle()}
        disabled={!enabled}
        title={note || label}
        className={`relative flex flex-col items-center gap-1.5 rounded-2xl py-3 px-2 transition-colors duration-200 ${
          enabled ? "cursor-pointer" : "cursor-not-allowed"
        } ${
          active
            ? "bg-indigo-500/25 text-white"
            : enabled
              ? "bg-white/[0.06] text-white/60 hover:bg-white/[0.1]"
              : "bg-white/[0.03] text-white/25"
        }`}
      >
        <span className={active ? "text-white" : ""}>{icon}</span>
        <span className="text-[9px] font-medium leading-none">{label}</span>
        {!enabled && (
          <span className="absolute top-1.5 right-1.5">
            <svg
              width="8"
              height="8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="2.5"
            >
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V7a4 4 0 018 0v4" />
            </svg>
          </span>
        )}
      </motion.button>
    );
  },
);

export default ControlToggle;
