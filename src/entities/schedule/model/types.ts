export interface ScheduleDay {
  weekday: number; // 1..7 (1=Lunes)
  startTime: string | null;
  endTime: string | null;
  splitStartTime: string | null;
  splitEndTime: string | null;
  restDay: boolean;
}

export interface Schedule {
  id: string;
  name: string;
  active: boolean;
  entryToleranceMin: number;
  exitToleranceMin: number;
  mealBreakMin: number;
  minOvertimeMin: number;
  crossesMidnight: boolean;
  days: ScheduleDay[];
  assigned?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScheduleDayInput {
  weekday: number;
  startTime?: string | null;
  endTime?: string | null;
  splitStartTime?: string | null;
  splitEndTime?: string | null;
  restDay?: boolean;
}

export interface ScheduleInput {
  name: string;
  entryToleranceMin?: number;
  exitToleranceMin?: number;
  mealBreakMin?: number;
  minOvertimeMin?: number;
  crossesMidnight?: boolean;
  days: ScheduleDayInput[];
}

export interface AssignmentRow {
  id: string;
  userId: string;
  employeeName: string;
  employeeNumber: string | null;
  departmentId: string | null;
  departmentName: string | null;
  scheduleId: string;
  scheduleName: string;
  from: string;
}

/** Persona con asignación vigente de un horario. */
export interface AssignedPerson {
  userId: string;
  employeeName: string;
  employeeNumber: string | null;
}

export interface OvertimeRow {
  userId: string;
  employeeName: string;
  employeeNumber: string | null;
  departmentId: string | null;
  departmentName: string | null;
  active: boolean;
  scheduleName: string | null;
  scheduledMin: number;
  workedMin: number;
  extraMin: number;
  missingMin: number;
  daysWithExtra: number;
  withoutSchedule: boolean;
  /** Minutos aprobados (lo contabilizado). */
  approvedMin: number;
  /** Minutos calculados aún sin decisión. */
  pendingMin: number;
  /** Minutos rechazados. */
  rejectedMin: number;
  approvedDays: number;
  pendingDays: number;
  rejectedDays: number;
}

export interface OvertimeSummary {
  peopleTotal: number;
  peopleWithExtra: number;
  totalExtraMinutes: number;
  totalWorkedMinutes: number;
  totalScheduledMinutes: number;
  /** Minutos aprobados (lo contabilizado). */
  totalApprovedMinutes: number;
  /** Minutos calculados aún sin decisión. */
  totalPendingMinutes: number;
  /** Minutos rechazados. */
  totalRejectedMinutes: number;
  range: { start: string; end: string; timezone: string; period: string };
}

export interface OvertimeResponse {
  data: OvertimeRow[];
  total: number;
  summary: OvertimeSummary;
}

/** Metadatos de la exportación a PDF (periodo de referencia, fecha y zona horaria). */
export interface OvertimePdfMeta {
  period: "DAY" | "WEEK" | "MONTH";
  date: string;
  timezone: string;
}

// ── Reporte semanal de asistencia (RH) ─────────────────────────────────────

/** Estado del día (mismo contrato que `POST /schedules/weekly-attendance`). */
export type WeeklyAttendanceDayStatus =
  | "WORKED"
  | "OVERTIME"
  | "ABSENCE"
  | "INCOMPLETE"
  | "REST"
  | "REST_WORKED"
  | "NO_INFO"
  | "FUTURE";

/** Decisión sobre el tiempo extra del día; PENDING = aún no aprobado. */
export type WeeklyAttendanceApproval = "APPROVED" | "REJECTED" | "PENDING";

export interface WeeklyAttendanceDay {
  date: string;
  status: WeeklyAttendanceDayStatus;
  entryAt: string | null;
  exitAt: string | null;
  sessions: Array<{ entryAt: string | null; exitAt: string | null; workedMinutes: number; incident: string | null }>;
  workedMin: number;
  scheduledMin: number;
  extraMin: number;
  missingMin: number;
  lateMin: number;
  shift: string | null;
  scheduledStartAt: string | null;
  approval: WeeklyAttendanceApproval | null;
  approvedExtraMin: number;
}

export interface WeeklyAttendanceTotals {
  workedMin: number;
  scheduledMin: number;
  extraMin: number;
  approvedExtraMin: number;
  pendingExtraMin: number;
  rejectedExtraMin: number;
  missingMin: number;
  absences: number;
  incompleteDays: number;
}

export interface WeeklyAttendanceRow {
  userId: string;
  employeeNumber: string | null;
  clockNumbers: string[];
  name: string;
  jobTitle: string | null;
  departmentId: string | null;
  departmentName: string | null;
  active: boolean;
  linked: boolean;
  scheduleName: string | null;
  withoutSchedule: boolean;
  days: WeeklyAttendanceDay[];
  totals: WeeklyAttendanceTotals;
}

export interface WeeklyAttendanceReport {
  range: { start: string; end: string; timezone: string; days: string[] };
  rows: WeeklyAttendanceRow[];
  summary: WeeklyAttendanceTotals & { people: number; unlinked: number; withoutSchedule: number };
}

/** Una fila de la vista Detallada: una persona en un día concreto. */
export interface WeeklyAttendanceDetailRow {
  userId: string;
  /** Número(s) de reloj, o el número de empleado, o "—". */
  clock: string;
  name: string;
  departmentName: string | null;
  day: WeeklyAttendanceDay;
}

/** Vista de la tabla: resumen semanal por persona o detalle por día. */
export type WeeklyAttendanceMode = "SUMMARY" | "DETAIL";

/**
 * Carga del PDF de Nómina: el documento replica la tabla tal como se ve. En
 * RESUMIDA `rows` son `WeeklyAttendanceRow[]`; en DETALLADA, ya filtradas y
 * ordenadas, `WeeklyAttendanceDetailRow[]`.
 */
export interface WeeklyAttendancePdfPayload {
  report: WeeklyAttendanceReport;
  mode: WeeklyAttendanceMode;
  rows: WeeklyAttendanceRow[] | WeeklyAttendanceDetailRow[];
  meta: { departmentName: string | null };
}

export interface WeeklyAttendanceQuery {
  /** Cualquier día de la semana (`YYYY-MM-DD`). */
  date: string;
  departmentId?: string;
  q?: string;
}
