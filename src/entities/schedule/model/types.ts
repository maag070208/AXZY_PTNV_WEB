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
