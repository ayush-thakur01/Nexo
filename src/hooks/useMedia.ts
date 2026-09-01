import { useEffect, useRef } from "react";
import { useIslandStore } from "../store/islandStore";
import { MediaMetadata } from "../types";
import { showSustained, clearSustained } from "../utils/activities";

const KEY_FIELDS: (keyof MediaMetadata)[] = [
  "title",
  "artist",
  "album",
  "artwork",
  "state",
  "duration",
];

export function useMedia(): void {
  const setMediaMetadata = useIslandStore((s) => s.setMediaMetadata);
  const setMediaPosition = useIslandStore((s) => s.setMediaPosition);
  const settings = useIslandStore((s) => s.settings);
  const prev = useRef<MediaMetadata | null>(null);

  useEffect(() => {
    if (!settings.enableMediaControls) return;

    const unsub = window.api.media.onChange((raw: unknown) => {
      const data = raw as MediaMetadata | null;

      // Position is a per-second heartbeat; only touch the lightweight field
      // so the progress bar updates without re-rendering the widget chrome.
      setMediaPosition(data ? data.position : 0);

      const meaningful = isMeaningfulChange(prev.current, data);
      prev.current = data;
      if (!meaningful) return;

      setMediaMetadata(data);
      if (!data || data.state === "stopped") {
        clearSustained("media");
        return;
      }
      if (data.state === "playing" || data.state === "paused") {
        showSustained("media");
      }
    });

    return () => unsub();
  }, [settings.enableMediaControls, setMediaMetadata, setMediaPosition]);
}

function isMeaningfulChange(
  a: MediaMetadata | null,
  b: MediaMetadata | null,
): boolean {
  if (a === b) return false;
  if (!a || !b) return true;
  return KEY_FIELDS.some((k) => a[k] !== b[k]);
}