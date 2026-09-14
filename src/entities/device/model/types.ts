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
  // Cartas responsivas ACTIVAS en las que figura este dispositivo
  cartaItems?: DeviceCartaItem[];
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

export interface CartaResponsable {
  id: string;
  name: string;
  username: string;
}

export interface DeviceCartaItem {
  id: string;
  carta: {
    id: string;
    consecutive: string;
    fecha: string;
    numeroEmpleado: string;
    departamento: string;
    deliveryBy: string;
    returnDate?: string | null;
    responsable?: CartaResponsable | null;
    encargado?: CartaResponsable | null;
    ubicacion?: { id: string; lugar: string } | null;
  };
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

export interface DeviceAvailabilityCarta {
  consecutive: string;
  fecha: string;
  numeroEmpleado: string;
  departamento: string;
  deliveryBy: string;
  responsable?: string | null;
  encargado?: string | null;
  lugar?: string | null;
}

export interface DeviceAvailabilityRow {
  id: string;
  controlActivos: string;
  descripcion: string;
  marca: string;
  modelo: string;
  estado: "DISPONIBLE" | "ASIGNADO" | "BAJA";
  area: string;
  ubicacion?: string | null;
  carta?: DeviceAvailabilityCarta | null;
}

export interface DeviceAvailabilityGroup {
  typeId: string;
  code: string;
  name: string;
  total: number;
  disponible: number;
  asignado: number;
  devices: DeviceAvailabilityRow[];
}

export interface LoteSharedUpdate {
  typeId?: string;
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
