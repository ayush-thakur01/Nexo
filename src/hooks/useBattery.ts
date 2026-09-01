import { useEffect } from "react";
import { useIslandStore } from "../store/islandStore";

export function useBattery(): void {
  const setBattery = useIslandStore((s) => s.setBattery);
  const settings = useIslandStore((s) => s.settings);

  useEffect(() => {
    if (!settings.enableBattery) return;

    const unsub = window.api.battery.onChange((data) => {
      setBattery({
        level: data.level,
        charging: data.charging,
        chargingTime: 0,
        dischargingTime:
          data.minutesRemaining && data.minutesRemaining > 0
            ? data.minutesRemaining
            : 0,
        status:
          (data.status as "full" | "charging" | "discharging" | "notPresent") ??
          "discharging",
        minutesRemaining: data.minutesRemaining ?? -1,
      });
    });

    return () => unsub();
  }, [settings.enableBattery, setBattery]);
}
