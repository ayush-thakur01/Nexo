import { useEffect } from "react";
import { useIslandStore } from "../store/islandStore";
import { NotificationData } from "../types";
import { showNotification } from "../utils/activities";

export function useNotifications(): void {
  const addNotification = useIslandStore((s) => s.addNotification);
  const settings = useIslandStore((s) => s.settings);

  useEffect(() => {
    if (!settings.enableNotifications) return;

    const unsub = window.api.notification.onReceive((data: unknown) => {
      const raw = data as Partial<NotificationData>;
      const notification: NotificationData = {
        id: raw.id || `notif-${Date.now()}`,
        appName: raw.appName || "Unknown",
        title: raw.title || "",
        body: raw.body || "",
        timestamp: raw.timestamp || Date.now(),
        persistent: false,
        category: "toast",
        actions: [],
      };
      addNotification(notification);
      showNotification(settings.notificationTimeout || 5000);
    });

    return () => unsub();
  }, [settings.enableNotifications, settings.notificationTimeout, addNotification]);
}
