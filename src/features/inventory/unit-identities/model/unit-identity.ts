import type { DeviceType } from "@entities/inventory";

/** Identificación de UNA pieza física mientras se captura. */
export interface UnitIdentityRow {
  id: number;
  serialNumber: string;
  macAddress: string;
  ip: string;
  hostname: string;
}

let rowId = 0;

/** Renglón vacío con id propio (el id es de la pantalla, no de la base). */
export const emptyUnitRow = (): UnitIdentityRow => ({
  id: (rowId += 1),
  serialNumber: "",
  macAddress: "",
  ip: "",
  hostname: "",
});

/**
 * Ajusta la lista de renglones a una cantidad, CONSERVANDO lo ya capturado: si
 * se sube la cantidad se agregan renglones vacíos al final y si se baja se
 * recortan, así que escribir la serie de la pieza 1 y luego corregir la
 * cantidad no borra lo escrito.
 */
export const resizeUnitRows = (rows: UnitIdentityRow[], quantity: number): UnitIdentityRow[] => {
  const next: UnitIdentityRow[] = [];
  for (let i = 0; i < quantity; i++) next.push(rows[i] ?? emptyUnitRow());
  return next;
};

/** ¿El tipo pide algún dato de identificación por pieza? */
export const usesUnitIdentity = (type?: DeviceType | null): boolean =>
  !!type && (type.useSerialNumber || type.useMac || type.useIp || type.useHostname);

