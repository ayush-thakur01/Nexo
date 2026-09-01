import { useEffect } from "react";
import { useIslandStore } from "../store/islandStore";
import { ClipboardData, BrightnessState } from "../types";

export function useSystemStreams(): void {
  const setBrightness = useIslandStore((s) => s.setBrightness);
  const settings = useIslandStore((s) => s.settings);

  useEffect(() => {
    if (!settings.enableBrightness) return;
    const unsub = window.api.quickControls.onBrightness(
      (data: { level: number; supported: boolean; error?: string }) => {
        const next: BrightnessState = {
          value: data.level > 0 ? data.level / 100 : 0,
          supported: !!data.supported,
          error: data.error,
        };
        setBrightness(next);
      },
    );
    return () => unsub();
  }, [settings.enableBrightness, setBrightness]);

  useEffect(() => {
    if (!settings.enableClipboard) return;
    const unsub = window.api.quickControls.onClipboard((data: unknown) => {
      const raw = data as Partial<ClipboardData>;
      useIslandStore.getState().setClipboard({
        type: (raw.type as ClipboardData["type"]) || "text",
        preview: raw.preview,
        timestamp: raw.timestamp || Date.now(),
      });
    });
    return () => unsub();
  }, [settings.enableClipboard]);
}
