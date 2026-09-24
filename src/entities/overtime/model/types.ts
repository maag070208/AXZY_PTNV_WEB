/** Estado de aprobación de un día de tiempo extra. La ausencia de decisión = PENDIENTE. */
export type OvertimeDayStatus = "PENDIENTE" | "APROBADO" | "RECHAZADO";

/** Un día de tiempo extra (persona + día) con su estado de aprobación. */
export interface OvertimeDayRow {
  userId: string;
  employeeName: string;
  numeroEmpleado: string | null;
  departmentId: string | null;
  departmentName: string | null;
  active: boolean;
  /** Día local `YYYY-MM-DD`. */
  date: string;
  extraMin: number;
  workedMin: number;
  programadasMin: number;
  horarioNombre: string | null;
  descanso: boolean;
  sinHorario: boolean;
  status: OvertimeDayStatus;
  /** Minutos contabilizados (snapshot aprobado). */
  approvedExtraMin: number;
  note: string | null;
  decidedById: string | null;
  decidedByName: string | null;
  decidedAt: string | null;
}

export interface OvertimeSummary {
  totalDays: number;
  pendingDays: number;
  approvedDays: number;
  rejectedDays: number;
  pendingMinutes: number;
  approvedMinutes: number;
  rejectedMinutes: number;
  peopleWithPending: number;
  range: { start: string; end: string; timezone: string; period: string };
}

export interface OvertimeQueryResponse {
  data: OvertimeDayRow[];
  total: number;
  page: number;
  pageIndex: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  summary: OvertimeSummary;
}

export interface OvertimeDecideInput {
  filters: Record<string, string | number | boolean>;
  items: Array<{ userId: string; date: string }>;
  status: OvertimeDayStatus;
  note?: string;
}

export interface OvertimeDecideResult {
  updated: number;
  skipped: number;
}
