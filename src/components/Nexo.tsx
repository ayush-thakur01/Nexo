import React, { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIslandStore } from "../store/islandStore";
import IdleIsland from "./IdleIsland";
import NotificationWidget from "./NotificationWidget";
import MediaWidget from "./MediaWidget";
import VolumeWidget from "./VolumeWidget";
import BrightnessWidget from "./BrightnessWidget";
import BatteryWidget from "./BatteryWidget";
import ClipboardWidget from "./ClipboardWidget";
import DownloadWidget from "./DownloadWidget";
import MicIndicator from "./MicIndicator";
import NetworkWidget from "./NetworkWidget";
import AIPanel from "./AIPanel";
import ContextMenu from "./ContextMenu";
import QuickControlsPanel from "./QuickControlsPanel";
import SettingsPanel from "./SettingsPanel";
import { islandDimensions } from "../animations/config";
import { springPresets } from "../animations/springs";
import { WidgetType } from "../types";

const Nexo: React.FC = React.memo(() => {
  const currentWidget = useIslandStore((s) => s.currentWidget);
  const isVisible = useIslandStore((s) => s.island.isVisible);
  const isAIPanelOpen = useIslandStore((s) => s.isAIPanelOpen);
  const isContextMenuOpen = useIslandStore((s) => s.isContextMenuOpen);
  const isQuickControlsOpen = useIslandStore((s) => s.isQuickControlsOpen);
  const isSettingsOpen = useIslandStore((s) => s.isSettingsOpen);
  const settings = useIslandStore((s) => s.settings);
  const setCurrentWidget = useIslandStore((s) => s.setCurrentWidget);
  const setAIPanelOpen = useIslandStore((s) => s.setAIPanelOpen);
  const setContextMenuOpen = useIslandStore((s) => s.setContextMenuOpen);
  const setQuickControlsOpen = useIslandStore((s) => s.setQuickControlsOpen);
  const setSettingsOpen = useIslandStore((s) => s.setSettingsOpen);
  const updateSetting = useIslandStore((s) => s.updateSetting);
  const mediaExpanded = useIslandStore((s) => s.mediaExpanded);
  const setMediaExpanded = useIslandStore((s) => s.setMediaExpanded);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClickAt = useRef<number>(0);
  const lastToggleWidget = useRef<WidgetType | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Resize to the requested widget's intrinsic dimensions. We only animate width/height
  // when the active widget actually changes (or quick controls opens/closes). This is the
  // *only* layout-driven animation, and it's clamped so we never ping-pong the pill.
  // The media widget has two sizes: compact pill vs. user-expanded full controls.
  useEffect(() => {
    if (!isVisible) return;
    if (isQuickControlsOpen) {
      window.api.island.resize(
        islandDimensions.controls.width,
        islandDimensions.controls.height,
      );
      return;
    }
    const widgetKey =
      currentWidget === "media" && mediaExpanded
        ? "media-expanded"
        : currentWidget || "idle";
    const dim = islandDimensions[widgetKey] || islandDimensions.idle;
    window.api.island.resize(dim.width, dim.height);
  }, [currentWidget, isQuickControlsOpen, isVisible, mediaExpanded]);

  const handleClick = useCallback(() => {
    const now = Date.now();
    const isDouble = now - lastClickAt.current < 320;
    lastClickAt.current = now;
    if (isDouble) return; // dblclick handler will deal with it

    if (isQuickControlsOpen) {
      setQuickControlsOpen(false);
      return;
    }
    if (isSettingsOpen) {
      setSettingsOpen(false);
      return;
    }
    if (isAIPanelOpen) {
      setAIPanelOpen(false);
      return;
    }

    if (currentWidget === "media") {
      // Tapping the media pill toggles compact <-> full controls.
      setMediaExpanded(!mediaExpanded);
      return;
    }

    if (currentWidget) {
      // First tap on an expanded pill collapses back to the previous widget (not always idle).
      const last = useIslandStore.getState().island.lastWidget ?? null;
      setCurrentWidget(last);
    } else {
      // First tap on idle opens Quick Controls (more useful than collapsing nothing).
      setQuickControlsOpen(true);
    }
  }, [
    currentWidget,
    mediaExpanded,
    isQuickControlsOpen,
    isSettingsOpen,
    isAIPanelOpen,
    setMediaExpanded,
    setQuickControlsOpen,
    setSettingsOpen,
    setAIPanelOpen,
    setCurrentWidget,
  ]);

  const handleDoubleClick = useCallback(() => {
    const next = !settings.pinned;
    updateSetting("pinned", next);
    window.api.island.pin(next);
    lastClickAt.current = Date.now() + 500; // suppress the trailing click
  }, [settings.pinned, updateSetting]);

  const handleRightClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setContextMenuOpen(!isContextMenuOpen);
    },
    [isContextMenuOpen, setContextMenuOpen],
  );

  const handleMouseDown = useCallback(() => {
    setIsPressed(true);
    longPressTimer.current = setTimeout(() => {
      setIsPressed(false);
      setAIPanelOpen(true);
    }, 550);
  }, [setAIPanelOpen]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Remember the widget that was active before any transient widget so we can fall back to it.
  useEffect(() => {
    const transient: WidgetType[] = [
      "notification",
      "volume",
      "brightness",
      "battery",
      "download",
      "clipboard",
      "mic",
      "network",
    ];
    if (currentWidget && !transient.includes(currentWidget)) {
      lastToggleWidget.current = currentWidget;
      useIslandStore.setState((s) => ({
        island: { ...s.island, lastWidget: currentWidget },
      }));
    }
  }, [currentWidget]);

  if (!isVisible) return null;

  const widgetKey =
    currentWidget === "media" && mediaExpanded
      ? "media-expanded"
      : currentWidget || "idle";
  const dims =
    isQuickControlsOpen || isSettingsOpen
      ? isSettingsOpen
        ? { width: 320, height: 560 }
        : islandDimensions.controls
      : islandDimensions[widgetKey] || islandDimensions.idle;
  const borderRadius = isQuickControlsOpen || isSettingsOpen ? 28 : 9999;
  const containerStyle: React.CSSProperties = {
    width: dims.width,
    height: dims.height,
    borderRadius,
    background:
      isQuickControlsOpen || isSettingsOpen
        ? "rgba(8,8,12,0.92)"
        : "var(--island-bg)",
    // NOTE: Do NOT use backdrop-filter here. On a transparent Electron
    // window, backdrop-filter writes alpha 0 into the layered window's
    // hit-test channel, so the whole pill becomes click-through. A
    // semi-opaque background keeps the frosted look AND stays clickable.
    boxShadow: isHovered
      ? "0 18px 56px rgba(0, 0, 0, 0.55), inset 0 0 0 0.5px rgba(255, 255, 255, 0.10)"
      : "0 12px 40px rgba(0, 0, 0, 0.45), inset 0 0 0 0.5px rgba(255, 255, 255, 0.07)",
  };

  return (
    <>
      <motion.div
        className="cursor-pointer overflow-hidden flex items-center justify-center"
        style={containerStyle}
        animate={{ scale: isPressed ? 0.96 : isHovered ? 1.02 : 1 }}
        transition={springPresets.bouncy}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleRightClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <AnimatePresence mode="wait">
          {isSettingsOpen && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={springPresets.stiff}
              className="w-full h-full"
            >
              <SettingsPanel onClose={() => setSettingsOpen(false)} />
            </motion.div>
          )}
          {isQuickControlsOpen && (
            <motion.div
              key="quick-controls"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={springPresets.stiff}
              className="w-full h-full"
            >
              <QuickControlsPanel onClose={() => setQuickControlsOpen(false)} />
            </motion.div>
          )}
          {!isQuickControlsOpen &&
            !isSettingsOpen &&
            (!currentWidget || currentWidget === "idle") && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={springPresets.quick}
                className="w-full h-full"
              >
                <IdleIsland />
              </motion.div>
            )}
          {!isQuickControlsOpen &&
            !isSettingsOpen &&
            currentWidget === "notification" && (
              <motion.div
                key="notification"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={springPresets.stiff}
                className="w-full h-full"
              >
                <NotificationWidget />
              </motion.div>
            )}
          {!isQuickControlsOpen &&
            !isSettingsOpen &&
            currentWidget === "media" && (
              <motion.div
                key="media"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={springPresets.stiff}
                className="w-full h-full"
              >
                <MediaWidget />
              </motion.div>
            )}
          {!isQuickControlsOpen &&
            !isSettingsOpen &&
            currentWidget === "volume" && (
              <motion.div
                key="volume"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={springPresets.quick}
                className="w-full h-full"
              >
                <VolumeWidget />
              </motion.div>
            )}
          {!isQuickControlsOpen &&
            !isSettingsOpen &&
            currentWidget === "brightness" && (
              <motion.div
                key="brightness"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={springPresets.quick}
                className="w-full h-full"
              >
                <BrightnessWidget />
              </motion.div>
            )}
          {!isQuickControlsOpen &&
            !isSettingsOpen &&
            currentWidget === "battery" && (
              <motion.div
                key="battery"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={springPresets.stiff}
                className="w-full h-full"
              >
                <BatteryWidget />
              </motion.div>
            )}
          {!isQuickControlsOpen &&
            !isSettingsOpen &&
            currentWidget === "clipboard" && (
              <motion.div
                key="clipboard"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={springPresets.quick}
                className="w-full h-full"
              >
                <ClipboardWidget />
              </motion.div>
            )}
          {!isQuickControlsOpen &&
            !isSettingsOpen &&
            currentWidget === "download" && (
              <motion.div
                key="download"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={springPresets.quick}
                className="w-full h-full"
              >
                <DownloadWidget />
              </motion.div>
            )}
          {!isQuickControlsOpen &&
            !isSettingsOpen &&
            currentWidget === "mic" && (
              <motion.div
                key="mic"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={springPresets.stiff}
                className="w-full h-full"
              >
                <MicIndicator />
              </motion.div>
            )}
          {!isQuickControlsOpen &&
            !isSettingsOpen &&
            currentWidget === "network" && (
              <motion.div
                key="network"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={springPresets.quick}
                className="w-full h-full"
              >
                <NetworkWidget />
              </motion.div>
            )}
        </AnimatePresence>

        {/* Subtle "breathing" highlight that suggests activity without resizing the pill. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background: settings.pinned
              ? "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))"
              : "transparent",
          }}
          animate={isHovered ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }}
          transition={
            isHovered
              ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.2 }
          }
        />
      </motion.div>

      <AnimatePresence>
        {isAIPanelOpen && (
          <motion.div
            key="ai-panel"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={springPresets.bouncy}
            style={{
              position: "fixed",
              top: dims.height + 16,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 100,
            }}
          >
            <AIPanel onClose={() => setAIPanelOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {isContextMenuOpen && (
        <ContextMenu
          onClose={() => setContextMenuOpen(false)}
          onOpenSettings={() => {
            setSettingsOpen(true);
            setContextMenuOpen(false);
          }}
        />
      )}
    </>
  );
});

Nexo.displayName = "Nexo";

export default Nexo;
