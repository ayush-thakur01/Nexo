import { WidgetType } from "../types";
import { useIslandStore } from "../store/islandStore";

/**
 * Centralized activity/priority manager for Nexo.
 *
 * Priority model (spec §20): recording/mic and notifications outrank music;
 * music is sustained; transient system interactions (volume, brightness…) and
 * idle info never interrupt a sustained activity. This keeps the pill stable —
 * a transient event can never yank the island away from an active session, and
 * a notification that temporarily replaces music always restores it.
 */

// Widgets that persist until explicitly cleared (recorded media, mic, ...).
const SUSTAINED: WidgetType[] = ["media", "mic"];

// Relative priority among transient widgets (lower = wins ties).
const TRANSIENT_PRIORITY: Partial<Record<WidgetType, number>> = {
  volume: 1,
  brightness: 2,
  battery: 3,
  network: 3,
  clipboard: 4,
  download: 5,
};

const timers = new Map<string, ReturnType<typeof setTimeout>>();

function clearTimer(key: string): void {
  const t = timers.get(key);
  if (t) {
    clearTimeout(t);
    timers.delete(key);
  }
}

function panelOpen(): boolean {
  const s = useIslandStore.getState();
  return s.isQuickControlsOpen || s.isSettingsOpen || s.isAIPanelOpen;
}

/** Transient, auto-collapsing widget triggered by a system event. */
export function showTransient(type: WidgetType, duration = 2600): void {
  const s = useIslandStore.getState();
  const cur = s.currentWidget;

  if (panelOpen()) return;
  if (cur && SUSTAINED.includes(cur as WidgetType)) return; // never interrupt

  const curPri = cur ? TRANSIENT_PRIORITY[cur as WidgetType] : undefined;
  const nextPri = TRANSIENT_PRIORITY[type] ?? 9;
  if (curPri !== undefined && curPri <= nextPri) return; // keep current

  s.setCurrentWidget(type);
  clearTimer("transient");
  timers.set(
    "transient",
    setTimeout(() => {
      const st = useIslandStore.getState();
      if (st.currentWidget !== type) return;
      st.setCurrentWidget(null);
    }, duration),
  );
}

/** Sustained widget (media while a session is live, mic while recording). */
export function showSustained(type: WidgetType): void {
  if (panelOpen()) return;
  useIslandStore.getState().setCurrentWidget(type);
}

/** Clear a sustained widget, returning to idle without disturbing an override. */
export function clearSustained(type: WidgetType): void {
  const s = useIslandStore.getState();
  if (s.currentWidget === type) s.setCurrentWidget(null);
}

/** Notification: preempts the current activity, then restores it. */
export function showNotification(duration = 5000): void {
  const s = useIslandStore.getState();
  const cur = s.currentWidget;
  const displaced =
    cur && cur !== "idle" && !panelOpen() ? (cur as WidgetType) : null;
  s.setCurrentWidget("notification");
  clearTimer("notif");
  timers.set(
    "notif",
    setTimeout(() => {
      const st = useIslandStore.getState();
      if (st.currentWidget !== "notification") return;
      // Only restore a displaced sustained activity if it is still live.
      st.setCurrentWidget(
        displaced && SUSTAINED.includes(displaced) && isActivityActive(displaced)
          ? displaced
          : null,
      );
    }, duration),
  );
}

function isActivityActive(type: WidgetType): boolean {
  const s = useIslandStore.getState();
  if (type === "media") {
    return !!s.mediaMetadata && s.mediaMetadata.state !== "stopped";
  }
  if (type === "mic") {
    return s.sensors.micActive || s.sensors.cameraActive;
  }
  return false;
}
