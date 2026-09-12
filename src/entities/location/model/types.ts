import type { Device } from "@entities/device";

export interface Location {
  id: string;
  lugar?: string | null;
  subLugar?: string | null;
  numero?: string | null;
  descripcion?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { devices: number };
  devices?: Device[];
}