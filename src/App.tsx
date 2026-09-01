import React, { useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import Nexo from "./components/Nexo";
import { useVolume } from "./hooks/useVolume";
import { useMedia } from "./hooks/useMedia";
import { useNotifications } from "./hooks/useNotifications";
import { useBattery } from "./hooks/useBattery";
import { useDevices } from "./hooks/useDevices";
import { useNetwork } from "./hooks/useNetwork";
import { useLiveClock } from "./hooks/useLiveClock";
import { useQuickControls } from "./hooks/useQuickControls";
import { useSystemStreams } from "./hooks/useSystemStreams";
import { useSettings } from "./hooks/useSettings";

const App: React.FC = () => {
  useVolume();
  useMedia();
  useNotifications();
  useBattery();
  useDevices();
  useNetwork();
  useLiveClock();
  useQuickControls();
  useSystemStreams();
  useSettings();

  useEffect(() => {
    const off = window.api.admin.onError((data) => {
      const d = data as { message: string; feature?: string };
      toast.error(d.feature ? `${d.message} (${d.feature})` : d.message, {
        duration: 4500,
      });
    });
    return off;
  }, []);

  return (
    <>
      <Nexo />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "rgba(20,20,28,0.95)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.12)",
            fontSize: "12px",
          },
        }}
      />
    </>
  );
};

export default App;
