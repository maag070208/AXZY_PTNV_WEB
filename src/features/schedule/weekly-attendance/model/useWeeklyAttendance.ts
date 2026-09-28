import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { scheduleApi, toDayKey, type WeeklyAttendanceReport } from "@entities/schedule";
import { useDepartmentOptions } from "@entities/department";
import { useWeekStartDay } from "@entities/sys-config";
import { useDebouncedValue } from "@shared/lib/useDebouncedValue";
import { exportWeeklyAttendanceXlsx } from "./exportXlsx";

/** Genera el PDF (lo inyecta la página desde el widget de reportes). */
export type DownloadWeeklyAttendancePdf = (
  report: WeeklyAttendanceReport,
  meta: { departmentName: string | null }
) => Promise<void>;

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
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
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
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    scheduleApi
      .weeklyAttendance({ date, departmentId: departmentId || undefined, q: q || undefined })
      .then((res) => active && setReport(res))
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

  const exportPdf = useCallback(async () => {
    if (!report) return;
    setExporting("pdf");
    try {
      await downloadPdf(report, { departmentName });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common:errors.report"));
    } finally {
      setExporting(null);
    }
  }, [report, downloadPdf, departmentName, t]);

  const exportExcel = useCallback(async () => {
    if (!report) return;
    setExporting("excel");
    try {
      await exportWeeklyAttendanceXlsx(report, { departmentName, t });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common:errors.report"));
    } finally {
      setExporting(null);
    }
  }, [report, departmentName, t]);

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
    report,
    loading,
    error,
    setError,
    exporting,
    exportPdf,
    exportExcel,
  };
};

export type UseWeeklyAttendance = ReturnType<typeof useWeeklyAttendance>;
