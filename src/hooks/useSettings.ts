import { useEffect } from "react";
import { useIslandStore } from "../store/islandStore";

export function useSettings(): void {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      let saved;
      try {
        saved = await window.api.settings.get();
      } catch {
        saved = null;
      }
      if (cancelled) return;
      const merged = saved ? { ...saved } : useIslandStore.getState().settings;
      try {
        merged.startOnBoot = await window.api.startup.get();
      } catch {
        /* startup probe best-effort */
      }
      if (cancelled) return;
      useIslandStore.setState({ settings: merged });

      window.api.window.setAlwaysOnTop(!!merged.alwaysOnTop);
      if (merged.pinned) window.api.island.pin(true);
    })();

    const unsub = useIslandStore.subscribe((state, prev) => {
      if (state.settings === prev.settings) return;
      const s = state.settings;
      try {
        window.api.settings.update(s);
      } catch {
        /* best-effort */
      }
      if (s.alwaysOnTop !== prev.settings.alwaysOnTop) {
        window.api.window.setAlwaysOnTop(!!s.alwaysOnTop);
      }
      if (s.pinned !== prev.settings.pinned) {
        window.api.island.pin(!!s.pinned);
      }
      if (s.startOnBoot !== prev.settings.startOnBoot) {
        window.api.startup.set(!!s.startOnBoot);
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);
}
