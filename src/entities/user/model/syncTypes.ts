/** Motivo por el que una fila del Excel no se puede resolver sola. */
export type EmployeeSyncReason =
  | "MISSING_EMPLOYEE_NUMBER"
  | "INVALID_EMPLOYEE_NUMBER"
  | "DUPLICATE_EMPLOYEE_NUMBER"
  | "MISSING_NAME"
  | "DEPARTMENT_NOT_FOUND"
  | "INACTIVE_USER_EXISTS"
  | "NUMBER_MISMATCH"
  | "NAME_MATCHES_OTHER_USER";

/** Metadatos del archivo leído (`POST /users/sync/preview`). */
export interface EmployeeSyncFileInfo {
  employees: number;
  sheet: string;
}

/** Conteo de cada grupo del preview. */
export interface EmployeeSyncCounts {
  altas: number;
  bajas: number;
  coinciden: number;
  cambios: number;
  porResolver: number;
}

/** Alta propuesta: existe en el Excel y no en el sistema. */
export interface EmployeeSyncAltaRow {
  row: number;
  employeeNumber: string;
  name: string;
  departmentName: string;
  departmentId: string;
  jobTitle: string | null;
  payrollType: string | null;
  /** Horario tal como viene en el Excel, ya resuelto por la API. */
  scheduleName: string | null;
  /** Horario preseleccionado por la API (vacío si no lo encontró). */
  scheduleId: string | null;
  /** El horario del Excel no existe en el sistema: hay que elegirlo en pantalla. */
  scheduleWarning: boolean;
  proposedUsername: string;
  proposedPassword: string;
}

/** Baja propuesta: está en el sistema y no en el Excel. */
export interface EmployeeSyncBajaRow {
  userId: string;
  employeeNumber: string;
  name: string;
  departmentName: string;
  jobTitle: string | null;
  /** La persona está vinculada a un reloj (`time_clock_employees`). */
  linkedToClock: boolean;
}

/** Coincide por número pero el nombre o el departamento cambió respecto al Excel. */
export interface EmployeeSyncCambioRow {
  userId: string;
  row: number;
  employeeNumber: string;
  excelName: string;
  currentName: string;
  excelDepartmentName: string;
  currentDepartmentName: string;
}

/** Fila que no se puede resolver y queda excluida de la sincronización. */
export interface EmployeeSyncPendingRow {
  row: number;
  employeeNumber: string | null;
  name: string | null;
  departmentName: string | null;
  reason: EmployeeSyncReason;
  detail?: string;
}

/** Respuesta de `POST /users/sync/preview` (no escribe nada). */
export interface EmployeeSyncPreview {
  file: EmployeeSyncFileInfo;
  counts: EmployeeSyncCounts;
  altas: EmployeeSyncAltaRow[];
  bajas: EmployeeSyncBajaRow[];
  cambios: EmployeeSyncCambioRow[];
  porResolver: EmployeeSyncPendingRow[];
}

/** Alta que viaja en la confirmación, con lo editado en pantalla. */
export interface EmployeeSyncAltaInput {
  row: number;
  employeeNumber: string;
  name: string;
  departmentId: string;
  jobTitle?: string;
  username: string;
  password: string;
  scheduleId?: string;
}

/** Cuerpo de `POST /users/sync/confirm`. */
export interface EmployeeSyncConfirmInput {
  altas: EmployeeSyncAltaInput[];
  bajas: Array<{ userId: string }>;
  cambios?: Array<{ userId: string; name?: string; departmentId?: string }>;
}

export interface EmployeeSyncSystemCreated {
  userId: string;
  name: string;
  employeeNumber: string;
  username: string;
}

/** Lo que quedó aplicado en el sistema. */
export interface EmployeeSyncSystemResult {
  created: EmployeeSyncSystemCreated[];
  deactivated: Array<{ userId: string; name: string; employeeNumber: string }>;
  updated: Array<{ userId: string; name: string }>;
}

/** Resultado por reloj de una alta o baja. */
export interface EmployeeSyncClockAccount {
  serial: string;
  name: string;
  ok: boolean;
  code?: string;
}

/** Resultado del reloj para una persona. */
export interface EmployeeSyncClockResult {
  userId: string;
  name: string;
  action: "ALTA" | "BAJA";
  ok: boolean;
  /** Quedó pendiente porque un reloj es de solo lectura (no es error). */
  pending: boolean;
  clocks: EmployeeSyncClockAccount[];
  /** Asignación de horario en el reloj; si falló, queda pendiente con su error. */
  schedule?: { ok: boolean; error?: string };
}

/** Respuesta de `POST /users/sync/confirm`. */
export interface EmployeeSyncConfirmResult {
  system: EmployeeSyncSystemResult;
  clock: { enabled: boolean; results: EmployeeSyncClockResult[] };
}

/** Fila inválida del 422 `USER_SYNC_INVALID_ROWS` (nada se aplica). */
export interface EmployeeSyncInvalidRow {
  row?: number;
  userId?: string;
  field: string;
  code: string;
}

/** Fila del reporte que se manda a `POST /users/sync/export`. */
export interface EmployeeSyncReportRow {
  employeeNumber?: string;
  name?: string;
  department?: string;
  system?: string;
  clock?: string;
}
