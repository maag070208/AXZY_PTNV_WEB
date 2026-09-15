import type { Device, DepartmentRef } from "@entities/device";

export type MovementType = "ENTRADA" | "SALIDA" | "TRASLADO" | "BAJA" | "PRESTAMO" | "DEVOLUCION";

export type CondicionType = "BUENO" | "ACEPTABLE" | "MALO" | "ROTO";

export interface InventoryMovement {
  id: string;
  deviceId: string;
  device: Device;
  departmentId?: string | null;
  department?: DepartmentRef | null;
  tipo: MovementType;
  notas?: string | null;
  userId: string;
  user: { id: string; name: string; username: string };
  createdAt: string;
  prestamoId?: string | null;
  prestamo?: InventoryMovement | null;
  prestadoA?: string | null;
  fechaRetornoEsperado?: string | null;
  condicion?: CondicionType | null;
  motivoBaja?: string | null;
}

export interface InventorySummaryDepartment extends DepartmentRef {
  _count?: { devices: number };
}

export interface InventorySummary {
  departments: InventorySummaryDepartment[];
  stats: {
    totalDevices: number;
    departmentDevices: number;
    unassignedDevices: number;
  };
}

export type DownloadInventoryPdf = (
  movements: InventoryMovement[],
  departments: InventorySummaryDepartment[]
) => Promise<void>;