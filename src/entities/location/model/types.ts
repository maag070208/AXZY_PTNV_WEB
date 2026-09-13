import type { Device } from "@entities/device";

export interface Sublugar {
  id: string;
  locationId: string;
  name: string;
  numero?: string | null;
  active: boolean;
  createdAt: string;
}

export interface Location {
  id: string;
  lugar: string;
  active?: boolean;
  descripcion?: string | null;
  createdAt: string;
  updatedAt: string;
  sublugares?: Sublugar[];
  _count?: { devices: number; cartas: number };
  devices?: Device[];
}