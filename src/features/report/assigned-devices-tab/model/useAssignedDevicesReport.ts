import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import {
  reportsApi,
  type AssignedDevicesPdfPayload,
  type AssignedDevicesStats,
} from "@entities/report";
import { appliedFilters, type TableQuery } from "@shared/utils/tableFilters";
import { dyn } from "@shared/i18n/dyn";

/** Orden vigente de la tabla; la columna ES una unidad física. */
export type AssignedDevicesSort = NonNullable<ITDataTableFetchParams["sort"]>;

/** Orden estable: el mismo al que cae el API cuando el `sort` no está en su allowlist. */
export const DEFAULT_ASSIGNED_SORT: AssignedDevicesSort = { key: "assetTag", direction: "asc" };

/** Columnas filtrables → llave i18n de su encabezado. */
const FILTER_LABELS: Record<string, string> = {
  assetTag: "assigned.activeCol",
  description: "assigned.colDescription",
  custodian: "assigned.colCustodian",
  department: "assigned.colDept",
  folio: "assigned.colFolioSource",
  date: "assigned.colDate",
  daysAssigned: "assigned.colDays",
  start: "pdf.filterFrom",
  end: "pdf.filterTo",
};

/** Fecha local `YYYY-MM-DD`, la clave de día que el API resuelve en su zona. */
const toDateInput = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export type { AssignedDevicesPdfPayload } from "@entities/report";

export type DownloadAssignedDevicesPdf = (payload: AssignedDevicesPdfPayload) => Promise<void>;

interface Options {
  download: DownloadAssignedDevicesPdf;
}

/**
 * Estado de la pestaña "Asignados". La fila ES la unidad prestada: filtros,
 * orden y paginación se resuelven en el servidor, y los KPIs se leen de `stats`
 * del conjunto filtrado completo (no de la página visible).
 */
export const useAssignedDevicesReport = ({ download }: Options) => {
  const { t } = useTranslation(["reports", "common"]);
  const [stats, setStats] = useState<AssignedDevicesStats | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Rango vacío = sin recorte (comportamiento previo). Con rango, el API filtra
  // por la fecha del préstamo VIGENTE, así que las unidades no prestadas quedan
  // fuera y tabla, KPIs y PDF quedan consistentes.
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  /** Rango de fechas expuesto a la tabla como filtros externos (clave de día). */
  const externalFilters = useMemo(() => {
    const filters: Record<string, string | number | boolean> = {};
    if (dateRange[0]) filters.start = toDateInput(dateRange[0]);
    if (dateRange[1]) filters.end = toDateInput(dateRange[1]);
    return filters;
  }, [dateRange]);

  /**
   * Última consulta que la tabla encontró. Los filtros de columna viven dentro
   * de `ITDataTable`, así que se_guardan aquí para que el PDF salga con el mismo
   * recorte que el usuario está viendo.
   */
  const lastQuery = useRef<TableQuery>({ filters: {}, sort: DEFAULT_ASSIGNED_SORT });

  const fetchTableData = useCallback(async (params: ITDataTableFetchParams) => {
    const filters = params.filters as Record<string, string | number | boolean>;
    const sort = params.sort ?? DEFAULT_ASSIGNED_SORT;
    lastQuery.current = { filters, sort };

    const res = await reportsApi.assigned({ page: params.page, limit: params.limit, filters, sort });
    setStats(res.stats);
    return {
      data: res.data as unknown as Record<string, unknown>[],
      total: res.total,
    };
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      const { filters, sort } = lastQuery.current;
      const res = await reportsApi.assignedExport({ page: 1, limit: 100, filters, sort });
      await download({
        data: res.data,
        stats: res.stats,
        truncated: res.truncated,
        meta: {
          generatedAt: new Date().toISOString(),
          appliedFilters: appliedFilters(filters, FILTER_LABELS, dyn(t)),
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("assigned.errorLoad"));
    } finally {
      setExporting(false);
    }
  }, [download, t]);

  return {
    t,
    stats,
    error,
    setError,
    exporting,
    reloadKey,
    setReloadKey,
    dateRange,
    setDateRange,
    externalFilters,
    handleDownloadPdf,
    fetchTableData,
  };
};

export type UseAssignedDevicesReport = ReturnType<typeof useAssignedDevicesReport>;
