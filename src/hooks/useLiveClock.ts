import { useEffect } from "react";
import { useIslandStore } from "../store/islandStore";

function formatClock(d: Date): string {
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes().toString().padStart(2, "0");
  const suffix = d.getHours() >= 12 ? "PM" : "AM";
  return `${h}:${m} ${suffix}`;
}

export function useLiveClock(): void {
  const setClock = useIslandStore((s) => s.setClock);

  useEffect(() => {
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      setClock(formatClock(new Date()));
    };
    tick();

    // Recompute only when the displayed minute actually rolls over. The label
    // only shows HH:MM, so ticking every second just re-renders for nothing.
    let lastMinute = new Date().getMinutes();
    const id = window.setInterval(() => {
      const now = new Date();
      if (now.getMinutes() !== lastMinute) {
        lastMinute = now.getMinutes();
        tick();
      }
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [setClock]);
}
