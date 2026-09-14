import type { Device } from "@entities/device";

export interface Sublugar {
  id: string;
  locationId: string;
  name: string;
  numero?: string | null;
  active: boolean;
  createdAt: string;
}

export interface CartaResponsable {
  id: string;
  name: string;
  username: string;
}

export interface LocationCartaItem {
  id: string;
  device?: { id: string; controlActivos: string; descripcion?: string } | null;
  controlActivos: string;
  descripcion: string;
}

export interface LocationCarta {
  id: string;
  consecutive: string;
  fecha: string;
  returnDate?: string | null;
  returnCondition?: string | null;
  responsable?: CartaResponsable | null;
  encargado?: CartaResponsable | null;
  items: LocationCartaItem[];
}

export interface Location {
  id: string;
  lugar: string;
  active?: boolean;
  descripcion?: string | null;
  departmentId?: string | null;
  createdAt: string;
  updatedAt: string;
  sublugares?: Sublugar[];
  _count?: { devices: number; cartas: number };
  devices?: Device[];
  cartas?: LocationCarta[];
}