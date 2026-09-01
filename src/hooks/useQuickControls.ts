import { useEffect } from "react";
import { useIslandStore } from "../store/islandStore";
import {
  SystemHealth,
  SystemCapabilities,
  BluetoothDevice,
  WifiNetwork,
} from "../types";

interface ToggleState {
  enabled: boolean;
  supported: boolean;
  error?: string;
}

export function useQuickControls(): void {
  const setCapabilities = useIslandStore((s) => s.setCapabilities);
  const setNightLight = useIslandStore((s) => s.setNightLight);
  const setFocus = useIslandStore((s) => s.setFocus);
  const setHealth = useIslandStore((s) => s.setHealth);
  const setBluetoothDevices = useIslandStore((s) => s.setBluetoothDevices);
  const setAvailableNetworks = useIslandStore((s) => s.setAvailableNetworks);

  useEffect(() => {
    const unsubCap = window.api.quickControls.onCapabilities((data) => {
      setCapabilities(data as SystemCapabilities);
    });
    const unsubBright = window.api.quickControls.onBrightness(() => {});
    const unsubBt = window.api.quickControls.onBluetoothDevices((data) => {
      setBluetoothDevices(data as BluetoothDevice[]);
    });
    const unsubNl = window.api.quickControls.onNightLight((data) => {
      setNightLight(data as ToggleState);
    });
    const unsubFocus = window.api.quickControls.onFocus((data) => {
      setFocus(data as ToggleState);
    });
    const unsubWifi = window.api.quickControls.onWifiNetworks((data) => {
      setAvailableNetworks(data as WifiNetwork[]);
    });
    const unsubHealth = window.api.quickControls.onHealth((data) => {
      setHealth(data as SystemHealth);
    });
    const unsubClipboard = window.api.quickControls.onClipboard(() => {
      // Used by the Clipboard widget via direct subscriber.
    });

    window.api.quickControls.refreshBluetoothDevices();

    return () => {
      unsubCap();
      unsubBright();
      unsubBt();
      unsubNl();
      unsubFocus();
      unsubWifi();
      unsubHealth();
      unsubClipboard();
    };
  }, [
    setCapabilities,
    setNightLight,
    setFocus,
    setHealth,
    setBluetoothDevices,
    setAvailableNetworks,
  ]);
}
