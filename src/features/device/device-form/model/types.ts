import type { Device } from "@entities/device";

export interface UnitForm {
  numeroSerie: string;
  nombreEquipo: string;
  ip: string;
  macAddress: string;
}

export interface LoteUnitRow {
  id: string;
  controlActivos: string;
  estado: Device["estado"];
  numeroSerie: string;
  nombreEquipo: string;
  ip: string;
  macAddress: string;
  area: string;
}

export const emptyUnit = (): UnitForm => ({
  numeroSerie: "",
  nombreEquipo: "",
  ip: "",
  macAddress: "",
});

export const toLoteRow = (d: Device): LoteUnitRow => ({
  id: d.id,
  controlActivos: d.controlActivos,
  estado: d.estado,
  numeroSerie: d.numeroSerie ?? "",
  nombreEquipo: d.nombreEquipo ?? "",
  ip: d.ip ?? "",
  macAddress: d.macAddress ?? "",
  area: d.area ?? "",
});

// Incrementa el último octeto de una IPv4 (ej. base .10 + offset 2 => .12).
// Regresa null si la IP base es inválida o si se sale de rango.
export const incrementIp = (base: string, offset: number): string | null => {
  const parts = base.trim().split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  const last = nums[3] + offset;
  if (last < 0 || last > 255) return null;
  return [nums[0], nums[1], nums[2], last].join(".");
};