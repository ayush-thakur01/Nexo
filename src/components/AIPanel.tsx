import React, { useState } from "react";
import { motion } from "framer-motion";
import { springPresets } from "../animations/springs";

interface Props {
  onClose: () => void;
}

const quickActions = [
  { label: "Open Spotify", cmd: "open spotify" },
  { label: "Open File Explorer", cmd: "open explorer" },
  { label: "Open Terminal", cmd: "open wt" },
  { label: "Show clipboard history", cmd: "clipboard" },
  { label: "Battery status", cmd: "battery" },
  { label: "Network status", cmd: "network" },
];

const AIPanel: React.FC<Props> = ({ onClose }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>(
    [{ text: "How can I help?", isUser: false }],
  );

  const handleSubmit = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages((p) => [...p, { text, isUser: true }]);
    setInput("");
    const cmd = text.toLowerCase();
    let reply = "";
    if (cmd.includes("clipboard"))
      reply =
        "Clipboard history is on the Quick Controls panel. Press Ctrl+Shift+D to toggle the island, or click it.";
    else if (cmd.startsWith("open ") || cmd.startsWith("launch ")) {
      const name = text.replace(/open|launch/gi, "").trim();
      const launched = await window.api.invoke("app:launch", name);
      reply = launched
        ? `Launching "${name}"…`
        : `Couldn't find a native app for "${name}".`;
    } else if (cmd.includes("battery"))
      reply =
        "Battery percentage and charging status are always visible in the idle pill.";
    else if (cmd.includes("timer"))
      reply = "Use the Pomodoro / Stopwatch on the Quick Controls panel.";
    else if (cmd.includes("weather"))
      reply =
        "Weather is on the wishlist — pull a forecast via a lightweight WinRT API.";
    else
      reply =
        'Try: "open <app>", "clipboard", "battery", "network", "timer", "weather".';
    setMessages((p) => [...p, { text: reply, isUser: false }]);
  };

  return (
    <div
      className="rounded-2xl p-3 w-[320px] shadow-2xl"
      style={{
        background: "rgba(8,8,12,0.92)",
        backdropFilter: "blur(40px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px]">
            AI
          </span>
          <span className="text-white/85 text-[12px] font-semibold">
            Assistant
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white/80 transition-colors"
          aria-label="Close"
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

      <div
        className="mb-2 max-h-32 overflow-y-auto space-y-1.5"
        style={{ scrollbarWidth: "none" }}
      >
        {messages.slice(-6).map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springPresets.quick}
            className={`text-[11px] leading-snug ${m.isUser ? "text-white/85 text-right" : "text-white/55"}`}
          >
            {m.text}
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {quickActions.map((a) => (
          <button
            key={a.label}
            onClick={() => setInput(a.cmd)}
            className="text-[10px] text-white/65 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2 py-1 rounded-full transition-colors"
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder="Ask anything..."
          className="flex-1 bg-white/5 text-white text-[12px] rounded-lg px-3 py-2 outline-none placeholder-white/30"
          style={{ border: "1px solid rgba(255,255,255,0.06)" }}
        />
        <button
          onClick={handleSubmit}
          className="bg-white text-black text-[11px] font-medium rounded-lg px-3 py-2 hover:bg-white/90 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default AIPanel;
