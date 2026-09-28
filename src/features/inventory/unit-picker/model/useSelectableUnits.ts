import { useEffect, useState } from "react";
import { inventoryApi, type DeviceUnit } from "@entities/inventory";

/**
 * Unidades que se pueden entregar de un dispositivo: las disponibles y, al
 * editar una carta, las que ya tiene (`includeIds`: se liberan y pueden
 * volver a elegirse). Se leen al elegir el dispositivo, no de la lista de
 * existencias, para trabajar con el estado real de cada pieza.
 */
export const useSelectableUnits = (deviceId: string, includeIds: readonly string[] = []) => {
  const [units, setUnits] = useState<DeviceUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const includeKey = includeIds.join(",");

  useEffect(() => {
    if (!deviceId) {
      setUnits([]);
      return;
    }
    let cancelled = false;
    const include = new Set(includeKey ? includeKey.split(",") : []);
    setLoading(true);
    setError(null);
    inventoryApi
      .units(deviceId)
      .then((all) => {
        if (!cancelled) setUnits(all.filter((u) => u.status === "AVAILABLE" || include.has(u.id)));
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [deviceId, includeKey]);

  return { units, loading, error };
};
