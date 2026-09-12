import { useCallback, useEffect, useState } from "react";
import { deviceApi } from "../api/deviceApi";
import type { DeviceSummary } from "./types";

/** Encapsula la carga (y recarga) de los contadores de /devices/summary. */
export function useDeviceSummary() {
  const [summary, setSummary] = useState<DeviceSummary | null>(null);

  const reload = useCallback(() => {
    deviceApi
      .summary()
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { summary, reload };
}
