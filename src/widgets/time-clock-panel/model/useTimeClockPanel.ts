import { useEffect, useState } from "react";
import { timeClockApi, type TimeClockDevice } from "@entities/time-clock";

export type PanelTab =
  | "overview"
  | "people"
  | "events"
  | "camera"
  | "roster"
  | "employees"
  | "checkins"
  | "clocks";

/** Un solo selector de reloj para todo el panel. */
export const useTimeClockPanel = () => {
  const [devices, setDevices] = useState<TimeClockDevice[]>([]);
  const [serial, setSerial] = useState("");
  const [tab, setTab] = useState<PanelTab>("overview");

  useEffect(() => {
    timeClockApi
      .status()
      .then((s) => {
        setDevices(s.devices);
        setSerial((current) => current || s.devices[0]?.clockSerial || "");
      })
      .catch(() => setDevices([]));
  }, []);

  return { devices, serial, setSerial, tab, setTab };
};
