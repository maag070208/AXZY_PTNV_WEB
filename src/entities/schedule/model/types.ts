export interface HorarioDia {
  diaSemana: number; // 1..7 (1=Lunes)
  entrada: string | null;
  salida: string | null;
  entrada2: string | null;
  salida2: string | null;
  descanso: boolean;
}

export interface Horario {
  id: string;
  nombre: string;
  activo: boolean;
  toleranciaEntradaMin: number;
  toleranciaSalidaMin: number;
  comidaMin: number;
  cruzaMedianoche: boolean;
  dias: HorarioDia[];
  asignados?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface HorarioDiaInput {
  diaSemana: number;
  entrada?: string | null;
  salida?: string | null;
  entrada2?: string | null;
  salida2?: string | null;
  descanso?: boolean;
}

export interface HorarioInput {
  nombre: string;
  toleranciaEntradaMin?: number;
  toleranciaSalidaMin?: number;
  comidaMin?: number;
  cruzaMedianoche?: boolean;
  dias: HorarioDiaInput[];
}

export interface AsignacionRow {
  id: string;
  userId: string;
  employeeName: string;
  numeroEmpleado: string | null;
  departmentId: string | null;
  departmentName: string | null;
  horarioId: string;
  horarioNombre: string;
  desde: string;
}

/** Persona con asignación vigente de un horario. */
export interface AsignadoPersona {
  userId: string;
  employeeName: string;
  numeroEmpleado: string | null;
}

export interface HorasExtraRow {
  userId: string;
  employeeName: string;
  numeroEmpleado: string | null;
  departmentId: string | null;
  departmentName: string | null;
  active: boolean;
  horarioNombre: string | null;
  programadasMin: number;
  trabajadasMin: number;
  extraMin: number;
  faltanteMin: number;
  diasConExtra: number;
  sinHorario: boolean;
  /** Minutos aprobados (lo contabilizado). */
  aprobadoMin: number;
  /** Minutos calculados aún sin decisión. */
  pendienteMin: number;
  /** Minutos rechazados. */
  rechazadoMin: number;
  diasAprobados: number;
  diasPendientes: number;
  diasRechazados: number;
}

export interface HorasExtraSummary {
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

export interface HorasExtraResponse {
  data: HorasExtraRow[];
  total: number;
  summary: HorasExtraSummary;
}

/** Metadatos de la exportación a PDF (periodo de referencia, fecha y zona horaria). */
export interface HorasExtraPdfMeta {
  period: "DAY" | "WEEK" | "MONTH";
  date: string;
  timezone: string;
}
