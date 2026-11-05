import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  buildDepartmentRows,
  scheduleApi,
  toDayKey,
  type PayrollReviewState,
  type WeeklyAttendanceReport,
  type WeeklyDepartmentRow,
} from "@entities/schedule";
import {
  dashboardApi,
  type AttendanceTodayWidget,
  type HrRecordsWidget,
  type OvertimeWeekWidget,
} from "@entities/dashboard";
import { useWeekStartDay } from "@entities/sys-config";
import { useCan } from "@entities/user";
import { dateLocale } from "@shared/i18n";

const shiftDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const shortMonth = (date: Date): string =>
  date.toLocaleDateString(dateLocale(), { month: "short" }).replace(/\./g, "");

/** "2 – 8 nov" (mismo mes) o "29 oct – 4 nov" (mes distinto). */
const weekRangeLabel = ([start, end]: [Date, Date]): string =>
  start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
    ? `${start.getDate()} – ${end.getDate()} ${shortMonth(end)}`
    : `${start.getDate()} ${shortMonth(start)} – ${end.getDate()} ${shortMonth(end)}`;

/** Estado e importes del cierre que se guardan como fotografía en la semana. */
const buildSnapshot = (
  report: WeeklyAttendanceReport,
  departments: WeeklyDepartmentRow[]
): Record<string, unknown> => ({
  summary: {
    people: report.summary.people,
    workedMin: report.summary.workedMin,
    extraMin: report.summary.extraMin,
    approvedExtraMin: report.summary.approvedExtraMin,
    absences: report.summary.absences,
  },
  departments: departments.map((dept) => ({
    departmentId: dept.departmentId,
    name: dept.name,
    people: dept.people,
    normalMin: dept.normalMin,
    extraMin: dept.extraMin,
    approvedExtraMin: dept.approvedExtraMin,
    absences: dept.absences,
  })),
  people: report.rows.map((row) => ({
    departmentId: row.departmentId,
    name: row.name,
    clock: row.clockNumbers.join(", ") || row.employeeNumber || "—",
    workedMin: row.totals.workedMin,
    extraMin: row.totals.extraMin,
    approvedExtraMin: row.totals.approvedExtraMin,
    absences: row.totals.absences,
  })),
});

/**
 * Inicio de RH: lo pendiente de hoy (faltas, retardos, tiempo extra y
 * expedientes), el cierre de la semana de pre-nómina (revisión por
 * departamento y cierre en el API) y los reportes de la semana elegida.
 *
 * Cada fuente pide su permiso; sin él la sección no se pinta. La semana se
 * ancla al primer día configurado (`WEEK_START_DAY`) y la clave que viaja al API
 * es ese primer día (`YYYY-MM-DD`).
 */
export const useHrHome = () => {
  const { t } = useTranslation("hr-home");
  const weekStartDay = useWeekStartDay();
  const [weekDate, setWeekDate] = useState(() => new Date());

  const [report, setReport] = useState<WeeklyAttendanceReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<PayrollReviewState | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [attendance, setAttendance] = useState<AttendanceTodayWidget | null>(null);
  const [overtime, setOvertime] = useState<OvertimeWeekWidget | null>(null);
  const [records, setRecords] = useState<HrRecordsWidget | null>(null);

  const canPayroll = useCan("payroll.view");
  const canReview = useCan("payroll.review");
  const canClose = useCan("payroll.close");
  const canAttendance = useCan("attendance.view");
  const canOvertime = useCan("overtime.view");
  const canRecords = useCan("hr.records");

  const rangeValue = useMemo<[Date, Date]>(() => {
    const offset = (weekDate.getDay() - weekStartDay + 7) % 7;
    const start = new Date(weekDate);
    start.setDate(weekDate.getDate() - offset);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return [start, end];
  }, [weekDate, weekStartDay]);

  /** Clave de la semana para el API: su primer día. */
  const weekStart = toDayKey(rangeValue[0]);
  const weekLabel = weekRangeLabel(rangeValue);

  const departmentRows = useMemo(
    () => (report ? buildDepartmentRows(report) : []),
    [report]
  );
  const reviewedCount = reviews?.reviews.length ?? 0;
  const totalDepartments = departmentRows.length;
  const allReviewed = totalDepartments > 0 && reviewedCount >= totalDepartments;
  const closed = reviews?.closed ?? false;

  const previousWeek = useCallback(() => setWeekDate((date) => shiftDays(date, -7)), []);
  const nextWeek = useCallback(() => setWeekDate((date) => shiftDays(date, 7)), []);

  // ── Lo pendiente de hoy: cada widget pide su permiso y recorta por alcance ──
  useEffect(() => {
    let active = true;
    if (canAttendance) {
      dashboardApi
        .attendanceToday()
        .then((data) => active && setAttendance(data))
        .catch(() => active && setAttendance(null));
    }
    if (canOvertime) {
      dashboardApi
        .overtimeWeek()
        .then((data) => active && setOvertime(data))
        .catch(() => active && setOvertime(null));
    }
    if (canRecords) {
      dashboardApi
        .hrRecords()
        .then((data) => active && setRecords(data))
        .catch(() => active && setRecords(null));
    }
    return () => {
      active = false;
    };
  }, [canAttendance, canOvertime, canRecords]);

  // ── Reporte de la semana y su estado de revisión/cierre ──────────────────
  useEffect(() => {
    if (!canPayroll) return undefined;
    let active = true;
    setReportLoading(true);
    setReportError(null);
    scheduleApi
      .weeklyAttendance({ date: weekStart })
      .then((data) => active && setReport(data))
      .catch((error: unknown) =>
        active && setReportError(error instanceof Error ? error.message : t("errors.week"))
      )
      .finally(() => active && setReportLoading(false));
    scheduleApi
      .payrollReviewState(weekStart)
      .then((data) => active && setReviews(data))
      .catch((error: unknown) =>
        active && setReviewsError(error instanceof Error ? error.message : t("errors.review"))
      );
    return () => {
      active = false;
    };
  }, [canPayroll, weekStart, t]);

  const run = useCallback(
    (action: () => Promise<PayrollReviewState>) => {
      setBusy(true);
      setReviewsError(null);
      return action()
        .then((next) => setReviews(next))
        .catch((error: unknown) =>
          setReviewsError(error instanceof Error ? error.message : t("errors.action"))
        )
        .finally(() => setBusy(false));
    },
    [t]
  );

  /** Marca o desmarca un departamento de la semana. */
  const toggleReview = useCallback(
    (departmentId: string | null) => {
      const reviewed = !(reviews?.reviews.some((review) => review.departmentId === departmentId) ?? false);
      void run(() => scheduleApi.payrollSetReview({ weekStart, departmentId, reviewed }));
    },
    [reviews, run, weekStart]
  );

  /** «Marcar todo como revisado». */
  const reviewAll = useCallback(() => {
    void run(() =>
      scheduleApi.payrollReviewAll({
        weekStart,
        departmentIds: departmentRows.map((dept) => dept.departmentId),
      })
    );
  }, [departmentRows, run, weekStart]);

  /** Cierra la semana (el API exige todos los departamentos revisados). */
  const closeWeek = useCallback(() => {
    if (!report) return Promise.resolve();
    return run(() =>
      scheduleApi.payrollClose({
        weekStart,
        departmentIds: departmentRows.map((dept) => dept.departmentId),
        snapshot: buildSnapshot(report, departmentRows),
      })
    );
  }, [departmentRows, report, run, weekStart]);

  /** Reabre la semana cerrada para corregirla. */
  const reopenWeek = useCallback(() => {
    void run(() => scheduleApi.payrollReopen(weekStart));
  }, [run, weekStart]);

  return {
    t,
    weekLabel,
    weekStart,
    rangeValue,
    previousWeek,
    nextWeek,
    report,
    reportLoading,
    reportError,
    departmentRows,
    reviews,
    reviewsError,
    reviewedCount,
    totalDepartments,
    allReviewed,
    closed,
    busy,
    attendance,
    overtime,
    records,
    canPayroll,
    canReview,
    canClose,
    canAttendance,
    canOvertime,
    canRecords,
    toggleReview,
    reviewAll,
    closeWeek,
    reopenWeek,
  };
};

export type UseHrHome = ReturnType<typeof useHrHome>;
