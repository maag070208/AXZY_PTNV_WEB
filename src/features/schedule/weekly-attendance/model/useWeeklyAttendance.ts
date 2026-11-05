import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import {
  buildDetailRows,
  scheduleApi,
  toDayKey,
  type WeeklyAttendanceDetailRow,
  type WeeklyAttendanceMode,
  type WeeklyAttendancePdfPayload,
  type WeeklyAttendanceReport,
  type WeeklyAttendanceRow,
} from "@entities/schedule";
import { applyClientTableParams } from "@shared/api/clientTable";
import { useDepartmentOptions } from "@entities/department";
import { useWeekStartDay } from "@entities/sys-config";
import { useDebouncedValue } from "@shared/lib/useDebouncedValue";
import { detailFields, summaryFields } from "./fields";

/** Genera el PDF (lo inyecta la página desde el widget de reportes). */
export type DownloadWeeklyAttendancePdf = (payload: WeeklyAttendancePdfPayload) => Promise<void>;

export type { WeeklyAttendanceMode } from "@entities/schedule";

const shiftDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

/**
 * Estado del reporte semanal de asistencia: semana (cualquier día de ella;
 * el API la acomoda al primer día configurado), departamento y búsqueda.
 */
export const useWeeklyAttendance = ({ downloadPdf }: { downloadPdf: DownloadWeeklyAttendancePdf }) => {
  const { t } = useTranslation(["weekly-attendance", "common"]);
  const [weekDate, setWeekDate] = useState(() => new Date());
  const [departmentId, setDepartmentId] = useState("");
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim(), 350);
  const [report, setReport] = useState<WeeklyAttendanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [mode, setMode] = useState<WeeklyAttendanceMode>("SUMMARY");
  /** Filtros/orden vigentes de la tabla (columnas), para que el PDF salga igual. */
  const [tableParams, setTableParams] = useState<ITDataTableFetchParams | null>(null);
  /**
   * Sube con cada reporte cargado. La tabla es client-side y solo refetchea si
   * cambia alguno de sus disparadores (página/filtros/orden/`reloadTrigger`):
   * al llegar datos nuevos hay que empujarla con esto o se queda con lo viejo.
   */
  const [reportVersion, setReportVersion] = useState(0);
  const departments = useDepartmentOptions();
  const weekStart = useWeekStartDay();

  /** Rango [inicio, fin] de la semana según `WEEK_START_DAY` (por defecto miércoles→martes). */
  const rangeValue = useMemo<[Date, Date]>(() => {
    const offset = (weekDate.getDay() - weekStart + 7) % 7;
    const start = new Date(weekDate);
    start.setDate(weekDate.getDate() - offset);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return [start, end];
  }, [weekDate, weekStart]);

  const date = toDayKey(weekDate);
  /** Firma de los filtros de la barra: reinicia la tabla (página/filtros de columna). */
  const queryKey = `${date}|${departmentId}|${q}`;
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    scheduleApi
      .weeklyAttendance({ date, departmentId: departmentId || undefined, q: q || undefined })
      .then((res) => {
        if (!active) return;
        setReport(res);
        setReportVersion((v) => v + 1);
      })
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : t("loadError")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [date, departmentId, q, t]);

  const departmentName = useMemo(
    () => departments.data.find((d) => d.id === departmentId)?.name ?? null,
    [departments.data, departmentId]
  );

  /** Filas de la vista Detallada (una por persona y día). */
  const detailRows = useMemo<WeeklyAttendanceDetailRow[]>(
    () => (report ? buildDetailRows(report) : []),
    [report]
  );

  const exportPdf = useCallback(async () => {
    if (!report) return;
    setExporting(true);
    try {
      // El PDF replica la tabla: la vista vigente (Resumida/Detallada) con sus
      // filtros de columna y su orden (la barra ya se aplicó al pedir `report`).
      const detail = mode === "DETAIL";
      const rows = detail
        ? applyClientTableParams<WeeklyAttendanceDetailRow>(detailRows, tableParams, detailFields)
        : applyClientTableParams<WeeklyAttendanceRow>(report.rows, tableParams, summaryFields);
      await downloadPdf({ report, mode, rows, meta: { departmentName } });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common:errors.report"));
    } finally {
      setExporting(false);
    }
  }, [report, mode, detailRows, tableParams, downloadPdf, departmentName, t]);

  return {
    t,
    weekDate,
    setWeekDate,
    rangeValue,
    previousWeek: () => setWeekDate((d) => shiftDays(d, -7)),
    nextWeek: () => setWeekDate((d) => shiftDays(d, 7)),
    thisWeek: () => setWeekDate(new Date()),
    departmentId,
    setDepartmentId,
    departments,
    search,
    setSearch,
    mode,
    setMode,
    report,
    detailRows,
    tableParams,
    setTableParams,
    reportVersion,
    queryKey,
    loading,
    error,
    setError,
    exporting,
    exportPdf,
  };
};

export type UseWeeklyAttendance = ReturnType<typeof useWeeklyAttendance>;
