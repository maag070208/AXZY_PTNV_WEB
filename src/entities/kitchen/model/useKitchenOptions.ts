import { useEffect, useState } from "react";
import { kitchenApi } from "../api/kitchenApi";
import type { KitchenAlerts, KitchenCategory, KitchenItemRow, KitchenUnit, Supplier, TaxRate } from "./types";

/**
 * Opciones para selects: cargan el catálogo completo (el almacén de cocina es de
 * cientos de artículos, cabe en una petición). Se reutilizan entre pantallas.
 */
const useList = <T>(load: () => Promise<T[]>): { data: T[]; loading: boolean } => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    load()
      .then((rows) => active && setData(rows))
      .catch(() => active && setData([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { data, loading };
};

export const useKitchenItemOptions = (includeInactive = false) =>
  useList<KitchenItemRow>(async () => {
    const res = await kitchenApi.itemsTable({
      page: 1,
      limit: 200,
      filters: includeInactive ? {} : { active: true },
    });
    return res.data;
  });

export const useKitchenCategoryOptions = (includeInactive = false) =>
  useList<KitchenCategory>(() => kitchenApi.categories(includeInactive));

export const useKitchenUnitOptions = (includeInactive = false) =>
  useList<KitchenUnit>(() => kitchenApi.units(includeInactive));

export const useTaxRateOptions = (includeInactive = false) =>
  useList<TaxRate>(() => kitchenApi.taxRates(includeInactive));

export const useSupplierOptions = (includeInactive = false) =>
  useList<Supplier>(() => kitchenApi.suppliers(includeInactive));

/** Alertas del almacén (bajo mínimo, por caducar, caducados, sobre stock) para indicadores. */
export const useKitchenAlerts = (reloadKey = 0) => {
  const [alerts, setAlerts] = useState<KitchenAlerts | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    kitchenApi
      .alerts()
      .then((a) => active && setAlerts(a))
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [reloadKey]);
  return { alerts, error };
};
