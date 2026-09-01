import { useEffect } from "react";
import { useIslandStore } from "../store/islandStore";
import { showTransient } from "../utils/activities";

export function useVolume(): void {
  const setVolume = useIslandStore((s) => s.setVolume);
  const settings = useIslandStore((s) => s.settings);

  useEffect(() => {
    if (!settings.enableVolume) return;

    const unsub = window.api.volume.onChange((data) => {
      const previous = data.previousLevel ?? data.level;
      setVolume({
        level: data.level,
        muted: data.muted,
        isChanging: false,
        previousLevel: previous,
      });
      if (data.level !== previous || data.muted) {
        showTransient("volume");
      }
    });

    return () => unsub();
  }, [settings.enableVolume, setVolume]);
}
