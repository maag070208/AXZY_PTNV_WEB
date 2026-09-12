import type { Device } from "@entities/device";
import type { Location } from "@entities/location";

export type MovementType = "ENTRADA" | "SALIDA" | "TRASLADO" | "BAJA" | "PRESTAMO" | "DEVOLUCION";

export type CondicionType = "BUENO" | "ACEPTABLE" | "MALO" | "ROTO";

export interface InventoryMovement {
  id: string;
  deviceId: string;
  device: Device;
  locationId?: string | null;
  location?: Location | null;
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

export interface InventorySummary {
  locations: Location[];
  stats: {
    totalDevices: number;
    locatedDevices: number;
    unlocatedDevices: number;
  };
}