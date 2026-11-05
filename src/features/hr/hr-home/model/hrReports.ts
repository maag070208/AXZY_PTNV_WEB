import {
  dayLabel,
  hoursDecimal,
  workedTime,
  type WeeklyAttendanceReport,
} from "@entities/schedule";
import type { User } from "@entities/user";
import type { ReportDoc, ReportDocRow } from "@shared/lib/reportDoc";

/** Los cinco reportes del inicio de RH. */
export type HrReportId = "prenomina" | "attendance" | "incidents" | "overtime" | "staff";

export type HrReportTranslate = (key: string, options?: Record<string, unknown>) => string;

interface BuildInput {
  report: WeeklyAttendanceReport | null;
  /** Etiqueta de la semana ("2 – 8 nov"). */
  weekLabel: string;
  /** Plantilla activa (solo para el reporte `staff`). */
  employees?: User[];
  t: HrReportTranslate;
}

const APPROVAL_KEY: Record<string, string> = {
  APPROVED: "reports.approved",
  REJECTED: "reports.rejected",
  PENDING: "reports.pending",
};

const statusLabel = (day: { status: string; lateMin: number }, t: HrReportTranslate): string => {
  if (day.status === "ABSENCE") return t("reports.absence");
  if (day.lateMin > 0) return t("reports.late");
  if (day.status === "INCOMPLETE") return t("reports.incomplete");
  return t("reports.incident");
};

/**
 * Documento de uno de los reportes principales: mismas columnas y filas para la
 * pantalla, el PDF y el CSV. Los cuatro primeros salen del reporte semanal de
 * asistencia (la misma fuente que la pre-nómina); la plantilla, de las personas
 * activas de `/users/employees`.
 */
export const buildReportDoc = (
  id: HrReportId,
  { report, weekLabel, employees, t }: BuildInput
): ReportDoc => {
  const subtitle = `${weekLabel} · ${t("reports.generated")}`;

  if (id === "prenomina") {
    const byDepartment = new Map<
      string,
      { departmentId: string | null; name: string; people: number; normal: number; extra: number; approved: number; absences: number }
    >();
    for (const row of report?.rows ?? []) {
      const key = row.departmentId ?? "";
      const current =
        byDepartment.get(key) ??
        {
          departmentId: row.departmentId,
          name: row.departmentName ?? "—",
          people: 0,
          normal: 0,
          extra: 0,
          approved: 0,
          absences: 0,
        };
      current.people += 1;
      current.normal += Math.max(0, row.totals.workedMin - row.totals.extraMin);
      current.extra += row.totals.extraMin;
      current.approved += row.totals.approvedExtraMin;
      current.absences += row.totals.absences;
      byDepartment.set(key, current);
    }
    return {
      title: t("reports.prenomina.title"),
      subtitle,
      columns: [
        { key: "department", label: t("reports.columns.department") },
        { key: "people", label: t("reports.columns.people"), align: "center" },
        { key: "normal", label: t("reports.columns.normalHours"), align: "right" },
        { key: "extra", label: t("reports.columns.extraHours"), align: "right" },
        { key: "approved", label: t("reports.columns.approvedHours"), align: "right" },
        { key: "absences", label: t("reports.columns.absences"), align: "center" },
      ],
      rows: [...byDepartment.values()]
        .sort((a, b) => a.name.localeCompare(b.name, "es"))
        .map((row) => ({
          department: row.name,
          people: row.people,
          normal: hoursDecimal(row.normal),
          extra: hoursDecimal(row.extra),
          approved: hoursDecimal(row.approved),
          absences: row.absences,
        })),
    };
  }

  if (id === "attendance") {
    const rows: ReportDocRow[] = (report?.rows ?? []).map((row) => ({
      name: row.name,
      department: row.departmentName ?? "—",
      worked: hoursDecimal(row.totals.workedMin),
      extra: hoursDecimal(row.totals.extraMin),
      absences: row.totals.absences,
      incomplete: row.totals.incompleteDays,
    }));
    return {
      title: t("reports.attendance.title"),
      subtitle,
      columns: [
        { key: "name", label: t("reports.columns.name") },
        { key: "department", label: t("reports.columns.department") },
        { key: "worked", label: t("reports.columns.workedHours"), align: "right" },
        { key: "extra", label: t("reports.columns.extraHours"), align: "right" },
        { key: "absences", label: t("reports.columns.absences"), align: "center" },
        { key: "incomplete", label: t("reports.columns.incomplete"), align: "center" },
      ],
      rows,
    };
  }

  if (id === "incidents") {
    const rows: ReportDocRow[] = [];
    for (const row of report?.rows ?? []) {
      for (const day of row.days) {
        if (day.status !== "ABSENCE" && day.status !== "INCOMPLETE" && day.lateMin <= 0) continue;
        rows.push({
          name: row.name,
          department: row.departmentName ?? "—",
          day: dayLabel(day.date),
          status: statusLabel(day, t),
          late: day.lateMin > 0 ? workedTime(day.lateMin) : "—",
          entry: day.entryAt ? new Date(day.entryAt).toLocaleTimeString() : "—",
        });
      }
    }
    return {
      title: t("reports.incidents.title"),
      subtitle,
      columns: [
        { key: "name", label: t("reports.columns.name") },
        { key: "department", label: t("reports.columns.department") },
        { key: "day", label: t("reports.columns.day"), align: "center" },
        { key: "status", label: t("reports.columns.status") },
        { key: "late", label: t("reports.columns.late"), align: "right" },
        { key: "entry", label: t("reports.columns.entry"), align: "center" },
      ],
      rows,
    };
  }

  if (id === "overtime") {
    const rows: ReportDocRow[] = [];
    for (const row of report?.rows ?? []) {
      for (const day of row.days) {
        if (day.extraMin <= 0) continue;
        rows.push({
          name: row.name,
          department: row.departmentName ?? "—",
          day: dayLabel(day.date),
          extra: hoursDecimal(day.extraMin),
          approved: hoursDecimal(day.approvedExtraMin),
          status: day.approval ? t(APPROVAL_KEY[day.approval] ?? "reports.pending") : "—",
        });
      }
    }
    return {
      title: t("reports.overtime.title"),
      subtitle,
      columns: [
        { key: "name", label: t("reports.columns.name") },
        { key: "department", label: t("reports.columns.department") },
        { key: "day", label: t("reports.columns.day"), align: "center" },
        { key: "extra", label: t("reports.columns.extraHours"), align: "right" },
        { key: "approved", label: t("reports.columns.approvedHours"), align: "right" },
        { key: "status", label: t("reports.columns.status") },
      ],
      rows,
    };
  }

  // Plantilla activa: personas activas por departamento y puesto.
  const staff = (employees ?? []).filter((person) => person.active !== false);
  const rows: ReportDocRow[] = staff
    .map((person) => ({
      name: person.name,
      department: person.department?.name ?? "—",
      jobTitle: person.jobTitle ?? "—",
      employeeNumber: person.employeeNumber ?? "—",
    }))
    .sort((a, b) => a.department.localeCompare(b.department, "es") || a.name.localeCompare(b.name, "es"));
  return {
    title: t("reports.staff.title"),
    subtitle,
    columns: [
      { key: "name", label: t("reports.columns.name") },
      { key: "department", label: t("reports.columns.department") },
      { key: "jobTitle", label: t("reports.columns.jobTitle") },
      { key: "employeeNumber", label: t("reports.columns.employeeNumber"), align: "center" },
    ],
    rows,
  };
};

/** Nombre base del archivo de cada reporte ("rh_prenomina_2026-11-05"). */
export const reportFileName = (id: HrReportId, weekStart: string): string => `rh_${id}_${weekStart}`;

/** Descripción corta de cada reporte (la que se ve en la fila). */
export const REPORT_IDS: HrReportId[] = ["prenomina", "attendance", "incidents", "overtime", "staff"];
