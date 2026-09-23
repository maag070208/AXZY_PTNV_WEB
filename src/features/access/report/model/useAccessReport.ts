import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import {
  accessApi,
  type AccessReportPdfMeta,
  type AccessReportPeriod,
  type AccessReportSessionRow,
  type AccessReportSummary,
} from "@entities/access";
import { departmentsApi, type Department } from "@entities/department";
import { formatMinutesAsHhMm, formatTimeInTZ } from "@shared/utils/dates";

/** Firma del generador de PDF, inyectado por la página (widgets → features por DI). */
export type DownloadAccessReportPdf = (
  rows: AccessReportSessionRow[],
  summary: AccessReportSummary,
  meta: AccessReportPdfMeta
) => Promise<void>;

interface Options {
  download: DownloadAccessReportPdf;
}

/** Zona horaria del navegador; el reporte la usa para resolver los límites del día. */
const BROWSER_TIMEZONE =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Mexico_City";

/** Fecha local `YYYY-MM-DD` (día de referencia del periodo). */
const toDateInput = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * Estado del reporte de entradas/salidas por persona. La fila ES la persona;
 * `period` define la ventana (DÍA/SEMANA/MES), no la dimensión de la fila.
 */
export const useAccessReport = ({ download }: Options) => {
  const { t } = useTranslation(["access-report", "common"]);

  const [period, setPeriod] = useState<AccessReportPeriod>("DAY");
  const [date, setDate] = useState<Date | null>(new Date());
  const [departmentId, setDepartmentId] = useState("");
  const [q, setQ] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  const [summary, setSummary] = useState<AccessReportSummary | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    let active = true;
    departmentsApi
      .list()
      .then((list) => {
        if (active) setDepartments(list);
      })
      .catch(() => {
        if (active) setDepartments([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const dateKey = useMemo(() => toDateInput(date ?? new Date()), [date]);

  // `includeInactive` viaja como BOOLEANO (el contrato de tablas no acepta "false").
  const externalFilters = useMemo<Record<string, string | number | boolean>>(() => {
    const filters: Record<string, string | number | boolean> = {
      period,
      date: dateKey,
      tz: BROWSER_TIMEZONE,
      includeInactive,
    };
    if (departmentId) filters.departmentId = departmentId;
    const query = q.trim();
    if (query) filters.q = query;
    return filters;
  }, [period, dateKey, departmentId, q, includeInactive]);

  const fetchTableData = useCallback(async (params: ITDataTableFetchParams) => {
    const res = await accessApi.report({
      page: params.page,
      limit: params.limit,
      filters: params.filters as Record<string, string | number | boolean>,
      // Orden por defecto: departamento y luego nombre (el orden es estable).
      sort: params.sort ?? { key: "departmentName", direction: "asc" },
    });
    setSummary(res.summary);
    return {
      data: res.data as unknown as Record<string, unknown>[],
      total: res.total,
    };
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      const res = await accessApi.reportExport({
        page: 1,
        limit: 100,
        filters: externalFilters,
        sort: { key: "departmentName", direction: "asc" },
      });
      await download(res.data, res.summary, {
        period,
        date: dateKey,
        timezone: res.summary.range.timezone || BROWSER_TIMEZONE,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errors.load"));
    } finally {
      setExporting(false);
    }
  }, [download, externalFilters, period, dateKey, t]);

  const handleDownloadCsv = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      const res = await accessApi.reportExport({
        page: 1,
        limit: 1000,
        filters: externalFilters,
        sort: { key: "departmentName", direction: "asc" },
      });
      const tz = res.summary.range.timezone || BROWSER_TIMEZONE;
      const stamp = (iso: string | null): string => {
        if (!iso) return "";
        if (period === "DAY") return formatTimeInTZ(iso, tz);
        return `${new Date(iso).toLocaleDateString("es-MX")} ${formatTimeInTZ(iso, tz)}`;
      };
      const header = [
        t("columns.date"),
        t("columns.employee"),
        t("columns.department"),
        t("columns.puesto"),
        t("columns.entry"),
        t("columns.exit"),
        t("columns.hours"),
        t("columns.incident"),
      ];
      const lines = res.data.map((r) => [
        r.date,
        r.employeeName,
        r.departmentName ?? t("noDepartment"),
        r.puesto ?? "",
        stamp(r.entryAt),
        stamp(r.exitAt),
        r.entryAt && r.exitAt ? formatMinutesAsHhMm(r.workedMinutes) : "",
        r.incident ? t(`incidents.${r.incident}`) : "",
      ]);
      const escape = (cell: unknown) => `"${String(cell ?? "").replace(/"/g, '""')}"`;
      const csv = [header, ...lines].map((row) => row.map(escape).join(",")).join("\r\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `accesos-${period.toLowerCase()}-${dateKey}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errors.load"));
    } finally {
      setExporting(false);
    }
  }, [externalFilters, period, dateKey, t]);

  return {
    t,
    period,
    setPeriod,
    date,
    setDate,
    departmentId,
    setDepartmentId,
    q,
    setQ,
    includeInactive,
    setIncludeInactive,
    summary,
    exporting,
    error,
    setError,
    departments,
    externalFilters,
    fetchTableData,
    handleDownloadPdf,
    handleDownloadCsv,
  };
};

export type UseAccessReport = ReturnType<typeof useAccessReport>;
