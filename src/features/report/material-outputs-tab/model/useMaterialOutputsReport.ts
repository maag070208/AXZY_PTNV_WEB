import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  materialOutputsApi,
  type MaterialOutputFilters,
  type MaterialOutputReason,
  type MaterialOutputsPdfPayload,
} from "@entities/material-output";
import type { ITDataTableFetchParams, ITDataTableResponse } from "@axzydev/axzy_ui_system";

type CatalogOption = { id: string; name: string };
import { appliedFilters } from "@shared/utils/tableFilters";
import { dyn } from "@shared/i18n/dyn";

/** Filtros de la tabla → llave i18n de su etiqueta en el pie del PDF. */
const FILTER_LABELS: Record<string, string> = {
  departmentName: "exits.colDept",
  userName: "exits.colUser",
  q: "exits.colDescription",
  reason: "exits.colReason",
  date: "exits.colDate",
  device: "exits.colDevice",
  notes: "exits.colNotes",
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
  const { t } = useTranslation(["reports", "material-outputs", "common"]);
  const [total, setTotal] = useState(0);
  const [lastFilters, setLastFilters] = useState<ITDataTableFetchParams["filters"]>({});
  const [reloadKey, setReloadKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Rango vacío = sin recorte (comportamiento previo). Con rango, el API filtra
  // por `materialOutput.date` con fin EXCLUSIVO y la tabla, la KPIs y el PDF
  // comparten el mismo recorte.
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  // Opciones de Departamento y Usuario: todos los valores registrados (texto libre).
  const [nameOptions, setNameOptions] = useState<{ departments: CatalogOption[]; users: CatalogOption[] }>({
    departments: [],
    users: [],
  });
  const [nameOptionsState, setNameOptionsState] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    const toOptions = (values: string[]) => values.map((v) => ({ id: v, name: v }));
    materialOutputsApi
      .filterOptions()
      .then((o) => {
        setNameOptions({ departments: toOptions(o.departmentName), users: toOptions(o.userName) });
        setNameOptionsState("ready");
      })
      .catch(() => setNameOptionsState("error"));
  }, [reloadKey]);
  const departmentOptions = { data: nameOptions.departments, loading: nameOptionsState === "loading", error: nameOptionsState === "error" };
  const userOptions = { data: nameOptions.users, loading: nameOptionsState === "loading", error: nameOptionsState === "error" };

  /** Rango de fechas expuesto a la tabla como filtros externos (clave de día). */
  const externalFilters = useMemo(() => {
    const filters: Record<string, string | number | boolean> = {};
    if (dateRange[0]) filters.start = toDateInput(dateRange[0]);
    if (dateRange[1]) filters.end = toDateInput(dateRange[1]);
    return filters;
  }, [dateRange]);

  const fetchTableData = useCallback(
    async (
      params: ITDataTableFetchParams
    ): Promise<ITDataTableResponse<Record<string, unknown>>> => {
      setLastFilters(params.filters);
      try {
        const res = await materialOutputsApi.table({
          page: params.page,
          limit: params.limit,
          filters: params.filters,
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

  /** Traduce valores enum del filtro (Motivo) para el pie del PDF. */
  const valueLabel = useCallback(
    (key: string, value: string): string =>
      key === "reason"
        ? t(`material-outputs:reason.${value as MaterialOutputReason}`)
        : value,
    [t]
  );

  const handleDownloadPdf = useCallback(async () => {
    setExporting(true);
    try {
      // El rango manda desde el `externalFilters` VIGENTE: se descarta el
      // `start`/`end` de la última consulta (podía estar desfasado) y se fusiona
      // el actual, para que el PDF coincida con el rango que se ve.
      const { start: _start, end: _end, ...rest } = lastFilters;
      const exportFilters = { ...rest, ...externalFilters };
      const res = await materialOutputsApi.exportAll(exportFilters);
      await download({
        data: res.data,
        meta: {
          appliedFilters: appliedFilters(exportFilters, FILTER_LABELS, dyn(t), { translateValue: valueLabel }),
        },
      });
    } catch (e) {
      console.error("Error exporting the material outputs PDF", e);
    } finally {
      setExporting(false);
    }
  }, [download, lastFilters, t, externalFilters, valueLabel]);

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
    handleDownloadPdf,
    fetchTableData,
    departmentOptions,
    userOptions,
  };
};

export type UseMaterialOutputsReport = ReturnType<typeof useMaterialOutputsReport>;
