import { api } from "@shared/api/client";
import type {
  Condition,
  Dashboard,
  LoanReturn,
  Device,
  DeviceUnitStatus,
  Stock,
  StockLedgerRow,
  Movement,
  Loan,
  DeviceType,
  MovementType,
  DeviceUnit,
} from "../model/types";

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
  }) => api.post<Movement>(`/inventory/movements`, data),
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
    items: { deviceId: string; quantity: number }[];
  }) => api.post<Movement>(`/inventory/loans`, data),
  cancelLoan: (id: string) => api.post<Loan>(`/inventory/loans/${id}/cancel`),
  updateLoan: (id: string, data: {
    custodianId?: string;
    departmentId?: string;
    subareaId?: string;
    notes?: string;
    deviceId?: string;
    quantity?: number;
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
    items: { loanItemId: string; quantity: number; condition: Condition }[];
  }) => api.post<Movement>(`/inventory/returns`, data),

  // Dashboard
  dashboard: () => api.get<Dashboard>(`/inventory/dashboard`),
};

export type DeviceUnitStatusType = DeviceUnitStatus;