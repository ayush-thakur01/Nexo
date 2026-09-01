import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useIslandStore } from "../store/islandStore";
import { springPresets } from "../animations/springs";

interface SettingsPanelProps {
  onClose: () => void;
}

const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({
  value,
  onChange,
}) => (
  <motion.button
    className={`w-10 h-6 rounded-full relative ${value ? "bg-white" : "bg-white/15"}`}
    onClick={() => onChange(!value)}
    whileTap={{ scale: 0.95 }}
    role="switch"
    aria-checked={value}
  >
    <motion.div
      className="absolute top-1 w-4 h-4 rounded-full"
      style={{ background: value ? "#0a0a0f" : "rgba(255,255,255,0.9)" }}
      animate={{ left: value ? "20px" : "4px" }}
      transition={springPresets.volumeKnob}
    />
  </motion.button>
);

const Row: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex-1 pr-4">
      <p className="text-white/90 text-[13px]">{title}</p>
      {description && (
        <p className="text-white/40 text-[11px]">{description}</p>
      )}
    </div>
    {children}
  </div>
);

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const settings = useIslandStore((s) => s.settings);
  const updateSetting = useIslandStore((s) => s.updateSetting);
  const [local, setLocal] = useState(settings);
  const [adminOn, setAdminOn] = useState<boolean | null>(null);

  useEffect(() => {
    setLocal(settings);
  }, [settings]);

  useEffect(() => {
    let alive = true;
    window.api.admin
      .status()
      .then((v) => alive && setAdminOn(v))
      .catch(() => alive && setAdminOn(false));
    return () => {
      alive = false;
    };
  }, []);

  const handle = <K extends keyof typeof local>(
    key: K,
    value: (typeof local)[K],
  ) => {
    const next = { ...local, [key]: value };
    setLocal(next);
    updateSetting(key, value);
    if (key === "pinned") window.api.island.pin(value as boolean);
    if (key === "startOnBoot") window.api.startup.set(value as boolean);
  };

  return (
    <motion.div
      className="w-full h-full overflow-y-auto px-4 py-3"
      initial={{ x: 16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 16, opacity: 0 }}
      transition={springPresets.default}
      onClick={(e) => e.stopPropagation()}
      style={{ scrollbarWidth: "none" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-white text-[14px] font-semibold">Settings</span>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-colors"
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
        </button>
      </div>

      <div className="space-y-1">
        <Row
          title="Pinned (don't move with focus)"
          description="Double-click the pill to toggle."
        >
          <Toggle value={local.pinned} onChange={(v) => handle("pinned", v)} />
        </Row>
        <Row
          title="Start Nexo with Windows"
          description="Launches at sign-in. Off by default."
        >
          <Toggle
            value={local.startOnBoot}
            onChange={(v) => handle("startOnBoot", v)}
          />
        </Row>
        <Row title="Always on top">
          <Toggle
            value={local.alwaysOnTop}
            onChange={(v) => handle("alwaysOnTop", v)}
          />
        </Row>
        <Row title="Sound effects">
          <Toggle
            value={local.soundEffects}
            onChange={(v) => handle("soundEffects", v)}
          />
        </Row>
      </div>

      <div className="border-t border-white/10 mt-3 pt-3 space-y-2">
        <p className="text-white/45 text-[10px] uppercase tracking-wider">
          Animation
        </p>
        <div className="flex items-center justify-between py-1">
          <span className="text-white/85 text-[12px]">Speed</span>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.05}
            value={local.animationSpeed}
            onChange={(e) => handle("animationSpeed", Number(e.target.value))}
            className="w-32 h-1 bg-white/10 rounded-full appearance-none accent-white/60"
          />
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-white/85 text-[12px]">Blur</span>
          <input
            type="range"
            min={0}
            max={48}
            step={1}
            value={local.blurIntensity}
            onChange={(e) => handle("blurIntensity", Number(e.target.value))}
            className="w-32 h-1 bg-white/10 rounded-full appearance-none accent-white/60"
          />
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-white/85 text-[12px]">Transparency</span>
          <input
            type="range"
            min={0.3}
            max={1}
            step={0.05}
            value={local.transparency}
            onChange={(e) => handle("transparency", Number(e.target.value))}
            className="w-32 h-1 bg-white/10 rounded-full appearance-none accent-white/60"
          />
        </div>
      </div>

      <div className="border-t border-white/10 mt-3 pt-3 space-y-2">
        <p className="text-white/45 text-[10px] uppercase tracking-wider">
          Widgets
        </p>
        {(
          [
            ["enableNotifications", "Notifications"],
            ["enableMediaControls", "Media"],
            ["enableVolume", "Volume"],
            ["enableBrightness", "Brightness"],
            ["enableBattery", "Battery"],
            ["enableClipboard", "Clipboard"],
            ["enableDownloads", "Downloads"],
            ["enableScreenshot", "Screenshots"],
            ["enableMicrophoneIndicator", "Mic / Camera"],
            ["enableAIAssistant", "AI Assistant"],
          ] as Array<[keyof typeof local, string]>
        ).map(([k, label]) => (
          <Row key={k} title={label}>
            <Toggle
              value={Boolean(local[k])}
              onChange={(v) => handle(k, v as never)}
            />
          </Row>
        ))}
      </div>


      <div className="border-t border-white/10 mt-3 pt-3 space-y-2">
        <p className="text-white/45 text-[10px] uppercase tracking-wider">
          Accent
        </p>
        <div className="flex flex-wrap gap-2 py-1">
           {[
             "#0a84ff",
             "#5e5ce6",
             "#bf5af2",
             "#ff375f",
             "#ff9f0a",
             "#32d74b",
             "#64d2ff",
             "#ffd60a",
           ].map((c) => (
             <button
               key={c}
               className="w-6 h-6 rounded-full border-2 transition-all"
               style={{
                 background: c,
                 borderColor: local.accentColor === c ? "white" : "transparent",
               }}
               onClick={() => handle("accentColor", c)}
               aria-label={`Accent ${c}`}
             />
           ))}
         </div>
       </div>

       <div className="border-t border-white/10 mt-3 pt-3 space-y-2">
         <p className="text-white/45 text-[10px] uppercase tracking-wider">
           System
         </p>
         <Row title="Administrator mode">
           <span
             className={`text-[12px] font-medium ${
               adminOn ? "text-amber-300" : "text-white/50"
             }`}
           >
             {adminOn === null ? "…" : adminOn ? "ON" : "OFF"}
           </span>
         </Row>
         <p className="text-white/35 text-[10px] leading-relaxed">
           Run Nexo as administrator (right-click → Run as administrator) for
           Bluetooth, Wi-Fi, airplane mode and display brightness controls.
         </p>
       </div>
     </motion.div>
   );
 };

export default SettingsPanel;
