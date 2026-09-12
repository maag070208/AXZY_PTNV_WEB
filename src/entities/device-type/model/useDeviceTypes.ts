import { useCallback, useEffect, useState } from "react";
import { deviceTypeApi } from "../api/deviceTypeApi";
import type { DeviceType } from "./types";

/**
 * Carga la lista de tipos de dispositivo. Reutilizable por cualquier
 * feature/página que necesite el catálogo de tipos (filtros, formularios, etc.)
 * sin repetir el fetch + estado de loading en cada una.
 */
export function useDeviceTypes(includeInactive = false) {
  const [types, setTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    deviceTypeApi
      .list(includeInactive)
      .then(setTypes)
      .catch(() => setTypes([]))
      .finally(() => setLoading(false));
  }, [includeInactive]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { types, loading, reload };
}
