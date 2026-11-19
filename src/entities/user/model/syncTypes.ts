/** Motivo por el que una fila del Excel no se puede resolver sola. */
export type EmployeeSyncReason =
  | "MISSING_EMPLOYEE_NUMBER"
  | "INVALID_EMPLOYEE_NUMBER"
  | "DUPLICATE_EMPLOYEE_NUMBER"
  | "MISSING_NAME"
  | "DEPARTMENT_NOT_FOUND"
  | "INACTIVE_USER_EXISTS"
  | "NUMBER_MISMATCH"
  | "NAME_MATCHES_OTHER_USER"
  | "AMBIGUOUS_NAME";

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

/** Orden de nómina que ya tiene una persona en el sistema (1..N). */
export interface EmployeeSyncOrderEntry {
  userId: string;
  payrollOrder: number;
}

/** Alta propuesta: existe en el Excel y no en el sistema. */
export interface EmployeeSyncAltaRow {
  /**
   * Identidad única de la fila (`hoja:renglón`, p. ej. `"S y S:81"`): el número
   * de renglón se repite entre hojas. Es la clave de borradores y errores.
   */
  rowKey: string;
  /** Renglón visible en el Excel (solo para mostrar "fila N"). */
  row: number;
  /** Número de empleado; la API siempre lo propone (RH lo puede editar). */
  employeeNumber: string;
  /** El número lo propuso la API (la fila del Excel no lo traía). */
  employeeNumberGenerated: boolean;
  name: string;
  /** Nombre del departamento tal como viene en el Excel. */
  departmentName: string;
  /**
   * Departamento resuelto del catálogo; `null` cuando el del Excel no existe:
   * RH elige uno en pantalla y la confirmación lo exige.
   */
  departmentId: string | null;
  jobTitle: string | null;
  payrollType: string | null;
  /** Horario tal como viene en el Excel, ya resuelto por la API. */
  scheduleName: string | null;
  /** Horario preseleccionado por la API (vacío si no lo encontró). */
  scheduleId: string | null;
  /**
   * Motivo del aviso de horario (`"SCHEDULE_NOT_FOUND"` cuando el horario del
   * Excel no existe en el sistema); hay que elegirlo en pantalla.
   */
  scheduleWarning: string | null;
  /** Posición de la fila en el Excel (1..N): orden de la pre-nómina. */
  payrollOrder: number;
  proposedUsername: string;
  proposedPassword: string;
}

/** Baja propuesta: está en el sistema y no en el Excel. */
export interface EmployeeSyncBajaRow {
  userId: string;
  employeeNumber: string | null;
  name: string;
  departmentName: string | null;
  jobTitle: string | null;
  /** La persona está vinculada a un reloj (`time_clock_employees`). */
  linkedToClock: boolean;
}

/** Coincide con una persona del sistema pero el nombre o el departamento cambió. */
export interface EmployeeSyncCambioRow {
  userId: string;
  /** Identidad única de la fila (`hoja:renglón`). */
  rowKey: string;
  /** Renglón visible en el Excel (solo para mostrar). */
  row: number;
  /** Número del Excel (`null` si la fila no lo traía). */
  employeeNumber: string | null;
  /** Número que tiene la persona en el sistema (match por nombre). */
  currentEmployeeNumber: string | null;
  excelName: string;
  currentName: string;
  excelDepartmentName: string;
  currentDepartmentName: string | null;
}

/** Persona del sistema que podría corresponder a una fila por resolver. */
export interface EmployeeSyncPendingCandidate {
  userId: string;
  name: string;
  employeeNumber: string | null;
  departmentName: string | null;
}

/** Fila que no se pudo resolver sola; RH decide en pantalla qué es. */
export interface EmployeeSyncPendingRow {
  /** Identidad única de la fila (`hoja:renglón`). */
  rowKey: string;
  /** Renglón visible en el Excel (solo para mostrar "Fila N"). */
  row: number;
  /** Posición de la fila en el Excel: orden de la pre-nómina. */
  payrollOrder: number;
  employeeNumber: string | null;
  name: string | null;
  departmentName: string | null;
  /** Departamento del catálogo cuando el Excel lo trae resuelto. */
  departmentId: string | null;
  reason: EmployeeSyncReason;
  detail?: string;
  /** Personas parecidas del sistema (para vincular la fila). */
  candidates: EmployeeSyncPendingCandidate[];
  /** Usuario y contraseña propuestos si RH decide que es una persona nueva. */
  proposedUsername: string;
  proposedPassword: string;
}

/** Respuesta de `POST /users/sync/preview` (no escribe nada). */
export interface EmployeeSyncPreview {
  file: EmployeeSyncFileInfo;
  counts: EmployeeSyncCounts;
  /** Orden de nómina vigente en el sistema; se reenvía tal cual al confirmar. */
  order: EmployeeSyncOrderEntry[];
  altas: EmployeeSyncAltaRow[];
  bajas: EmployeeSyncBajaRow[];
  cambios: EmployeeSyncCambioRow[];
  porResolver: EmployeeSyncPendingRow[];
}

/** Alta que viaja en la confirmación, con lo editado en pantalla. */
export interface EmployeeSyncAltaInput {
  /** Identidad única de la fila (la usa la API para ubicarla en el archivo). */
  rowKey: string;
  row: number;
  /**
   * Opcional: si va vacío el servidor genera el número. Las altas convertidas
   * desde "Por resolver" lo mandan vacío para que se genere.
   */
  employeeNumber?: string;
  name: string;
  /** Obligatorio: el de la fila o el que RH elija cuando el del Excel no existe. */
  departmentId: string;
  jobTitle?: string;
  username: string;
  password: string;
  scheduleId?: string;
  /** Posición de la fila en el Excel: orden de la pre-nómina. */
  payrollOrder?: number;
}

/** Cuerpo de `POST /users/sync/confirm`. */
export interface EmployeeSyncConfirmInput {
  altas: EmployeeSyncAltaInput[];
  bajas: Array<{ userId: string }>;
  cambios?: Array<{ userId: string; name?: string; departmentId?: string }>;
  /** Eco del orden de nómina de `preview.order`. */
  order?: EmployeeSyncOrderEntry[];
}

export interface EmployeeSyncSystemCreated {
  userId: string;
  name: string;
  employeeNumber: string | null;
  username: string;
}

/** Lo que quedó aplicado en el sistema. */
export interface EmployeeSyncSystemResult {
  created: EmployeeSyncSystemCreated[];
  deactivated: Array<{ userId: string; name: string; employeeNumber: string | null }>;
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
  /** Identidad única de la fila; el 422 la devuelve desde el contrato nuevo. */
  rowKey?: string;
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
