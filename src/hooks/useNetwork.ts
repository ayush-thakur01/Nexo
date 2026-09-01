import { useEffect } from "react";
import { useIslandStore } from "../store/islandStore";
import { NetworkState } from "../types";
import { showTransient } from "../utils/activities";

export function useNetwork(): void {
  const setNetwork = useIslandStore((s) => s.setNetwork);
  const setSpeed = useIslandStore((s) => s.setSpeed);

  useEffect(() => {
    const unsubChange = window.api.network.onChange((data: unknown) => {
      const raw = data as Partial<NetworkState> & { error?: string };
      const prev = useIslandStore.getState().network;
      const next: NetworkState = {
        wifiConnected: !!raw.wifiConnected,
        wifiSSID: raw.wifiSSID ?? prev.wifiSSID,
        wifiSignal: raw.wifiSignal ?? prev.wifiSignal,
        wifiEnabled: !!raw.wifiEnabled,
        bluetooth: !!raw.bluetooth,
        bluetoothEnabled: !!raw.bluetoothEnabled,
        airplaneMode: !!raw.airplaneMode,
        vpnConnected: !!raw.vpnConnected,
        internetAvailable: !!raw.internetAvailable,
        connectionType: raw.connectionType ?? prev.connectionType,
        ipv4: raw.ipv4 ?? prev.ipv4,
        ipv6: raw.ipv6 ?? prev.ipv6,
        latencyMs: raw.latencyMs ?? prev.latencyMs,
      };
      setNetwork(next);

      if (raw.error) return;
      if (
        next.airplaneMode !== prev.airplaneMode ||
        next.internetAvailable !== prev.internetAvailable
      ) {
        showTransient("network", 3000);
      }
    });

    const unsubSpeed = window.api.network.onSpeed((data: unknown) => {
      const raw = data as {
        downBps: number;
        upBps: number;
        adapter: string;
        ipv4?: string;
        totalDownBytes?: number;
        totalUpBytes?: number;
      };
      const prev = useIslandStore.getState().speed;
      setSpeed({
        downBps: raw.downBps || 0,
        upBps: raw.upBps || 0,
        adapter: raw.adapter || prev.adapter,
        ipv4: raw.ipv4,
        totalDownBytes: raw.totalDownBytes ?? prev.totalDownBytes,
        totalUpBytes: raw.totalUpBytes ?? prev.totalUpBytes,
      });
    });

    return () => {
      unsubChange();
      unsubSpeed();
    };
  }, [setNetwork, setSpeed]);
}
