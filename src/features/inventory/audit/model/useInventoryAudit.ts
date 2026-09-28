import { useCallback, useEffect, useState } from "react";
import { inventoryApi, type InventoryAudit } from "@entities/inventory";

/** Auditoría del inventario en vivo (`GET /inventory/audit`), con recarga manual. */
export const useInventoryAudit = (enabled: boolean) => {
  const [audit, setAudit] = useState<InventoryAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAudit(await inventoryApi.audit());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  return { audit, loading, error, reload };
};
