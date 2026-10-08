export type DeviceUnitStatus = "AVAILABLE" | "ON_LOAN" | "DAMAGED" | "IN_MAINTENANCE" | "RETIRED";

export type MovementType =
  | "STOCK_IN"
  | "LOAN"
  | "RETURN"
  | "RETIREMENT"
  | "TRANSFER"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "MAINTENANCE_IN"
  | "MAINTENANCE_OUT"
  | "REVERSAL";

export type Condition = "GOOD" | "FAIR" | "POOR" | "BROKEN";

export type LoanStatus = "ACTIVE" | "PARTIAL" | "RETURNED" | "CANCELLED";

export interface DeviceType {
  id: string;
  code: string;
  name: string;
  assetTagPrefix: string;
  counter: number;
  active: boolean;
  useSerialNumber: boolean;
  useMac: boolean;
  useIp: boolean;
  useHostname: boolean;
  _count?: { devices: number };
}

/* ---------------------------------------------------------------------------
   Carga masiva desde Excel
   La previsualización devuelve, fila por fila, exactamente lo que haría la
   carga: alta de un dispositivo nuevo, unidades que se suman a uno existente,
   filas que caen al tipo genérico y los folios de activo fijo que se consumen.
--------------------------------------------------------------------------- */

export type DeviceImportAction = "CREATE" | "ADD_UNITS";

/** Motivos por los que una fila no se puede cargar (los traduce la UI). */
export type DeviceImportRowError =
  | "MISSING_NAME"
  | "INVALID_QUANTITY"
  | "QUANTITY_TOO_LARGE"
  | "NO_DEVICE_TYPE_AVAILABLE";

/** Avisos: la fila entra, pero con un valor por defecto que conviene revisar. */
export type DeviceImportRowWarning = "MISSING_BRAND" | "MISSING_MODEL";

export interface DeviceImportPreviewRow {
  row: number;
  typeName: string;
  resolvedTypeName: string;
  resolvedTypeCode: string;
  typeUnknown: boolean;
  typeMissing: boolean;
  name: string;
  brand: string;
  model: string;
  quantity: number;
  action: DeviceImportAction;
  mergedRows: number[];
  currentUnits: number;
  assetTagFrom: string | null;
  assetTagTo: string | null;
  warnings: DeviceImportRowWarning[];
  errors: DeviceImportRowError[];
}

export interface DeviceImportSummary {
  rows: number;
  valid: number;
  invalid: number;
  units: number;
  newDevices: number;
  existingDevices: number;
  genericRows: number;
  unknownTypeRows: number;
  typesToCreate: string[];
}

export interface DeviceImportPreview {
  rows: DeviceImportPreviewRow[];
  summary: DeviceImportSummary;
}

export interface DeviceImportResult {
  movementId: string;
  devicesCreated: number;
  devicesReused: number;
  unitsCreated: number;
  rows: number;
  fileName: string | null;
  /** La petición ya se había registrado: no se duplicó nada. */
  repeated: boolean;
}

export interface Device {
  id: string;
  typeId: string;
  type?: DeviceType;
  name: string;
  brand: string;
  model: string;
  description?: string | null;
  notes?: string | null;
  stock?: {
    total: number;
    AVAILABLE: number;
    ON_LOAN: number;
    DAMAGED: number;
    IN_MAINTENANCE: number;
    RETIRED: number;
  };
}

export interface DeviceUnit {
  id: string;
  deviceId: string;
  assetTag: string;
  serialNumber?: string | null;
  macAddress?: string | null;
  ip?: string | null;
  hostname?: string | null;
  area: string;
  status: DeviceUnitStatus;
  departmentId?: string | null;
}

export interface Stock {
  AVAILABLE: number;
  ON_LOAN: number;
  DAMAGED: number;
  IN_MAINTENANCE: number;
  RETIRED: number;
  active: number;
  historical: number;
}

export interface MovementItem {
  id: string;
  deviceId: string;
  device?: Device;
  quantity: number;
  condition?: Condition | null;
  notes?: string | null;
  units?: { id: string; deviceUnit: DeviceUnit }[];
}

export interface Movement {
  id: string;
  type: MovementType;
  date: string;
  createdById: string;
  createdBy?: { id: string; name: string } | null;
  custodian?: { id: string; name: string } | null;
  departmentId?: string | null;
  reason?: string | null;
  notes?: string | null;
  status: "ACTIVE" | "CANCELLED";
  reversalOfId?: string | null;
  loanId?: string | null;
  items: MovementItem[];
}

export interface LoanItem {
  id: string;
  deviceId: string;
  device?: Device;
  quantity: number;
  returnedQuantity: number;
  pending?: number;
  units?: { id: string; returned?: boolean; deviceUnit: DeviceUnit }[];
}

export interface Loan {
  id: string;
  custodianId?: string | null;
  custodian?: { id: string; name: string; username: string; employeeNumber?: string | null; department?: { id: string; name: string } | null } | null;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  subareaId?: string | null;
  subarea?: { id: string; name: string } | null;
  date: string;
  status: LoanStatus;
  number: string;
  notes?: string | null;
  items: LoanItem[];
  returns?: LoanReturn[];
}

export interface LoanReturnItem {
  id: string;
  deviceId: string;
  device?: Device;
  quantity: number;
  condition: Condition;
  notes?: string | null;
  units?: { id: string; deviceUnit: DeviceUnit }[];
}

export interface LoanReturn {
  id: string;
  loanId: string;
  loan?: {
    id: string;
    number: string;
    custodian?: { name: string } | null;
    department?: { name: string } | null;
  } | null;
  date: string;
  number: string;
  notes?: string | null;
  custodian?: { id: string; name: string } | null;
  items: LoanReturnItem[];
}

export interface StockLedgerRow {
  date: string;
  type: MovementType;
  stockIn: number;
  stockOut: number;
  balance: number;
  condition?: Condition | null;
  reason?: string | null;
  notes?: string | null;
  user?: string | null;
}

export interface DashboardStat {
  types: number;
  devices: number;
  activeUnits: number;
  available: number;
  loaned: number;
  damaged: number;
  maintenance: number;
  retirement: number;
}

export interface DashboardByType {
  id: string;
  code: string;
  name: string;
  devices: {
    id: string;
    name: string;
    brand: string;
    model: string;
    available: number;
    loaned: number;
    damaged: number;
    maintenance: number;
    retirement: number;
    total: number;
  }[];
}

export interface Dashboard {
  stats: DashboardStat;
  byType: DashboardByType[];
}
export type InventoryAuditCheckKey =
  | "UNIT_IN_MULTIPLE_OPEN_LOANS"
  | "LOAN_ITEM_PENDING_MISMATCH"
  | "OPEN_LOAN_UNIT_NOT_ON_LOAN"
  | "ON_LOAN_UNIT_WITHOUT_LOAN"
  | "CLOSED_LOAN_WITH_OPEN_UNITS"
  | "LOAN_STATUS_MISMATCH"
  | "MOVEMENT_UNITS_MISMATCH"
  | "LEDGER_MISMATCH";

/** `GET /inventory/audit`: cada regla con cuántos casos la rompen y ejemplos. */
export interface InventoryAudit {
  ok: boolean;
  checkedAt: string;
  checks: {
    key: InventoryAuditCheckKey;
    count: number;
    samples: string[];
    /** El caso en piezas, cuando la regla lo conoce (movimientos: tipo, día, dispositivo y cantidades). */
    rows?: {
      movementItemId?: string;
      movementType?: string;
      date?: string;
      device?: string;
      deviceId?: string;
      quantity?: number;
      linked?: number;
      /** Existencia (kardex) del dispositivo hoy. */
      ledger?: number;
      /** Piezas que quedarían ligadas al renglón al resolverlo. */
      linkedAfter?: number;
      /** Existencia del dispositivo si la cantidad del renglón queda en `linkedAfter`. */
      ledgerIfQuantity?: number;
    }[];
  }[];
}
