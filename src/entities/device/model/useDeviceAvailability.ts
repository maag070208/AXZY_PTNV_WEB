import { useCallback, useEffect, useState } from "react";
import { deviceApi } from "../api/deviceApi";
import type { DeviceAvailabilityGroup } from "./types";

/** Encapsula la carga (y recarga) del kardex de /devices/availability. */
export function useDeviceAvailability() {
  const [groups, setGroups] = useState<DeviceAvailabilityGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    deviceApi
      .availability()
      .then(setGroups)
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { groups, loading, reload };
}
