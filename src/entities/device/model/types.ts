import type { DeviceType } from "@entities/device-type";
import type { Location } from "@entities/location";

export interface Device {
  id: string;
  typeId: string;
  type?: DeviceType;
  controlActivos: string;
  descripcion: string;
  marca: string;
  modelo: string;
  numeroSerie?: string | null;
  nombreEquipo?: string | null;
  area: string;
  estado: "DISPONIBLE" | "ASIGNADO" | "BAJA";
  locationId?: string | null;
  location?: Location | null;
  // Especificaciones técnicas (TIC) — solo aplican a PC / TABLET / LAPTOP
  ip?: string | null;
  macAddress?: string | null;
  sistemaOp?: string | null;
  ram?: string | null;
  almacenamiento?: string | null;
  // Lote (alta por cantidad): dispositivos dados de alta juntos comparten loteId
  loteId?: string | null;
  loteSize?: number;
  loteCount?: { disponible: number; asignado: number; baja: number };
  history?: DeviceHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface DeviceHistoryEntry {
  id: string;
  deviceId: string;
  type: string;
  detail?: string | null;
  autor?: { id: string; name: string; username: string } | null;
  createdAt: string;
}

export interface DeviceSummary {
  total: number;
  disponible: number;
  asignado: number;
  baja: number;
  tipos: number;
}

export interface LoteSharedUpdate {
  descripcion?: string;
  marca?: string;
  modelo?: string;
  sistemaOp?: string;
  ram?: string;
  almacenamiento?: string;
}

export interface LoteUnitUpdate {
  id: string;
  numeroSerie?: string;
  nombreEquipo?: string;
  ip?: string;
  macAddress?: string;
  area?: string;
}
