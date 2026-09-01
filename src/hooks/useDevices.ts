import { useEffect } from "react";
import { useIslandStore } from "../store/islandStore";
import { showSustained, clearSustained } from "../utils/activities";

export function useDevices(): void {
  const setSensors = useIslandStore((s) => s.setSensors);
  const settings = useIslandStore((s) => s.settings);

  useEffect(() => {
    if (!settings.enableMicrophoneIndicator) return;

    const unsub = window.api.devices.onChange((data) => {
      setSensors({
        micActive: data.micActive,
        cameraActive: data.cameraActive,
      });

      if (data.micActive) {
        showSustained("mic");
      } else {
        clearSustained("mic");
      }
    });

    return () => unsub();
  }, [settings.enableMicrophoneIndicator, setSensors]);
}