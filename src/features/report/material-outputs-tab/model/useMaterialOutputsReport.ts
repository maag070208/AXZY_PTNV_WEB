import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  materialOutputsApi,
  type MaterialOutputFilters,
  type MaterialOutputsPdfPayload,
} from "@entities/material-output";
import type { ITDataTableFetchParams, ITDataTableResponse } from "@axzydev/axzy_ui_system";
import { appliedFilters } from "@shared/utils/tableFilters";
import { dyn } from "@shared/i18n/dyn";

/** Filtros de la tabla → llave i18n de su etiqueta en el pie del PDF. */
const FILTER_LABELS: Record<string, string> = {
  departmentName: "exits.colDept",
  userName: "exits.colUser",
  q: "exits.colDescription",
  reason: "exits.colReason",
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

export type DownloadMaterialOutputsPdf = (payload: MaterialOutputsPdfPayload) => Promise<void>;

interface Options {
  download: DownloadMaterialOutputsPdf;
}

export const useMaterialOutputsReport = ({ download }: Options) => {
  const { t } = useTranslation(["reports", "common"]);
  const [total, setTotal] = useState(0);
  const [lastFilters, setLastFilters] = useState<MaterialOutputFilters>({});
  const [reloadKey, setReloadKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Rango vacío = sin recorte (comportamiento previo). Con rango, el API filtra
  // por `materialOutput.date` con fin EXCLUSIVO y la tabla, la KPIs y el PDF
  // comparten el mismo recorte.
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  /** Rango de fechas expuesto a la tabla como filtros externos (clave de día). */
  const externalFilters = useMemo(() => {
    const filters: Record<string, string | number | boolean> = {};
    if (dateRange[0]) filters.start = toDateInput(dateRange[0]);
    if (dateRange[1]) filters.end = toDateInput(dateRange[1]);
    return filters;
  }, [dateRange]);

  /** Firma del rango: remonta la tabla al cambiar para volver a la página 1. */
  const tableKey = useMemo(() => JSON.stringify(externalFilters), [externalFilters]);

  const fetchTableData = useCallback(
    async (
      params: ITDataTableFetchParams
    ): Promise<ITDataTableResponse<Record<string, unknown>>> => {
      const filters = params.filters as unknown as MaterialOutputFilters;
      setLastFilters(filters);
      try {
        const res = await materialOutputsApi.table({
          page: params.page,
          limit: params.limit,
          filters: params.filters as Record<string, string | number | boolean>,
          sort: params.sort,
        });
        setTotal(res.total);
        return {
          data: res.data as unknown as Record<string, unknown>[],
          total: res.total,
        };
      } catch (e: any) {
        setError(e.message ?? t("exits.errorLoad"));
        return { data: [], total: 0 };
      }
    },
    [t]
  );

  const handleDownloadPdf = useCallback(async () => {
    setExporting(true);
    try {
      const res = await materialOutputsApi.list(lastFilters);
      await download({
        data: res.data,
        meta: {
          appliedFilters: appliedFilters(
            lastFilters as unknown as Record<string, string | number | boolean>,
            FILTER_LABELS,
            dyn(t)
          ),
        },
      });
    } catch (e) {
      console.error("Error exporting the material outputs PDF", e);
    } finally {
      setExporting(false);
    }
  }, [download, lastFilters, t]);

  return {
    t,
    total,
    error,
    setError,
    exporting,
    reloadKey,
    setReloadKey,
    dateRange,
    setDateRange,
    externalFilters,
    tableKey,
    handleDownloadPdf,
    fetchTableData,
  };
};

export type UseMaterialOutputsReport = ReturnType<typeof useMaterialOutputsReport>;
