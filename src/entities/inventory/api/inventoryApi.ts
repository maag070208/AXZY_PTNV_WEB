import { api } from "@shared/api/client";
import type {
  Condition,
  Dashboard,
  LoanReturn,
  Device,
  DeviceImportPreview,
  DeviceImportResult,
  DeviceUnitStatus,
  Stock,
  StockLedgerRow,
  Movement,
  Loan,
  DeviceType,
  MovementType,
  DeviceUnit,
  InventoryAudit,
} from "../model/types";

/** Encabezado de idempotencia: la API no repite un alta que ya registró con esa clave. */
const withIdempotencyKey = (key?: string) => (key ? { headers: { "Idempotency-Key": key } } : undefined);

export interface MovementItemInput {
  deviceId: string;
  quantity: number;
  condition?: Condition;
  loanItemId?: string;
  unitId?: string;
  notes?: string;
}

export const inventoryApi = {
  // Tipos
  types: () => api.get<DeviceType[]>(`/inventory/device-types`),
  createType: (data: { code: string; name: string; assetTagPrefix: string; useSerialNumber?: boolean; useMac?: boolean; useIp?: boolean; useHostname?: boolean }) =>
    api.post<DeviceType>(`/inventory/device-types`, data),
  updateType: (id: string, data: { name?: string; assetTagPrefix?: string; active?: boolean; useSerialNumber?: boolean; useMac?: boolean; useIp?: boolean; useHostname?: boolean }) =>
    api.put<DeviceType>(`/inventory/device-types/${id}`, data),
  deleteType: (id: string) => api.delete<DeviceType>(`/inventory/device-types/${id}`),

  // Dispositivos
  devices: (filters: { typeId?: string; q?: string; stock?: boolean } = {}) => {
    const params = new URLSearchParams();
    if (filters.typeId) params.set("typeId", filters.typeId);
    if (filters.q) params.set("q", filters.q);
    if (filters.stock) params.set("stock", "true");
    const qs = params.toString();
    return api.get<Device[]>(`/inventory/devices${qs ? `?${qs}` : ""}`);
  },
  createDevice: (data: {
    typeId: string;
    name: string;
    brand: string;
    model: string;
    description?: string;
    notes?: string;
    initialQuantity?: number;
    units?: { serialNumber?: string; macAddress?: string; ip?: string; hostname?: string }[];
  }) => api.post<Device>(`/inventory/devices`, data),
  getDevice: (id: string) => api.get<Device>(`/inventory/devices/${id}`),
  updateDevice: (
    id: string,
    data: { name?: string; brand?: string; model?: string; description?: string; notes?: string }
  ) => api.put<Device>(`/inventory/devices/${id}`, data),
  deleteDevice: (id: string) => api.delete<Device>(`/inventory/devices/${id}`),
  stock: (id: string) => api.get<Stock>(`/inventory/devices/${id}/stock`),
  units: (id: string) => api.get<DeviceUnit[]>(`/inventory/devices/${id}/units`),
  updateUnit: (id: string, data: { serialNumber?: string; macAddress?: string; ip?: string; hostname?: string; area?: string; departmentId?: string }) =>
    api.put<DeviceUnit>(`/inventory/units/${id}`, data),
  stockLedger: (id: string) =>
    api.get<{ device: Device; stock: Stock; rows: StockLedgerRow[] }>(
      `/inventory/devices/${id}/ledger`
    ),

  // Movimientos
  movements: (filters: { type?: string; deviceId?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.deviceId) params.set("deviceId", filters.deviceId);
    const qs = params.toString();
    return api.get<Movement[]>(`/inventory/movements${qs ? `?${qs}` : ""}`);
  },
  getMovement: (id: string) => api.get<Movement>(`/inventory/movements/${id}`),
  registerMovement: (data: {
    type: MovementType;
    custodianId?: string;
    departmentId?: string;
    reason?: string;
    notes?: string;
    loanId?: string;
    items: MovementItemInput[];
  }, idempotencyKey?: string) => api.post<Movement>(`/inventory/movements`, data, withIdempotencyKey(idempotencyKey)),
  revert: (id: string) => api.post<Movement>(`/inventory/movements/${id}/revert`),

  // Préstamos
  loans: (filters: { status?: string; custodianId?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.custodianId) params.set("custodianId", filters.custodianId);
    const qs = params.toString();
    return api.get<Loan[]>(`/inventory/loans${qs ? `?${qs}` : ""}`);
  },
  getLoan: (id: string) => api.get<Loan>(`/inventory/loans/${id}`),
  createLoan: (data: {
    custodianId?: string;
    departmentId?: string;
    subareaId?: string;
    notes?: string;
    /** `unitIds`: las unidades exactas que se entregan (la carta las imprime). */
    items: { deviceId: string; quantity?: number; unitIds?: string[] }[];
  }, idempotencyKey?: string) => api.post<Movement>(`/inventory/loans`, data, withIdempotencyKey(idempotencyKey)),
  cancelLoan: (id: string) => api.post<Loan>(`/inventory/loans/${id}/cancel`),
  updateLoan: (id: string, data: {
    custodianId?: string;
    departmentId?: string;
    subareaId?: string;
    notes?: string;
    deviceId?: string;
    quantity?: number;
    unitIds?: string[];
  }) => api.put<Loan>(`/inventory/loans/${id}`, data),

  // Devoluciones
  returns: (filters: { loanId?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.loanId) params.set("loanId", filters.loanId);
    const qs = params.toString();
    return api.get<LoanReturn[]>(`/inventory/returns${qs ? `?${qs}` : ""}`);
  },
  createLoanReturn: (data: {
    loanId: string;
    custodianId?: string;
    notes?: string;
    items: { loanItemId: string; quantity?: number; unitIds?: string[]; condition: Condition; notes?: string }[];
  }, idempotencyKey?: string) => api.post<Movement>(`/inventory/returns`, data, withIdempotencyKey(idempotencyKey)),

  /** Auditoría de consistencia del inventario (en vivo). */
  audit: () => api.get<InventoryAudit>(`/inventory/audit`),

  // Dashboard
  dashboard: () => api.get<Dashboard>(`/inventory/dashboard`),

  /* -------------------------------------------------------------------------
     Carga masiva desde Excel
     El archivo se manda DOS veces, en los dos pasos: la API lo vuelve a leer y
     a resolver en la confirmación en vez de confiar en lo que la pantalla dice
     que leyó. Así lo que el usuario revisó es exactamente lo que se ejecuta.
  ------------------------------------------------------------------------- */

  /** Paso 1: qué haría la carga. No escribe nada en el inventario. */
  previewDeviceImport: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<DeviceImportPreview>(`/inventory/devices/import/preview`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /** Paso 2: la carga real, en una sola transacción (todo o nada). */
  importDevices: (file: File, idempotencyKey?: string) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<DeviceImportResult>(`/inventory/devices/import`, form, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
    });
  },

  /** Plantilla Excel con los encabezados y el catálogo de tipos vigente. */
  deviceImportTemplate: () =>
    api.get<Blob>(`/inventory/devices/import/template`, { responseType: "blob" }),
};

export type DeviceUnitStatusType = DeviceUnitStatus;