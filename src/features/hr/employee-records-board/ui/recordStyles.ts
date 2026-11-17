export const hairline = "1px solid #edf1f5";
/** Columnas de la tabla: casilla, empleado, área, obligatorios, expediente, datos, estado, acción. */
export const recordsGrid =
  "grid grid-cols-[28px_minmax(0,2fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_40px] items-center gap-x-3";

export const NAVY = "#17233a";

export const countDone = (items: Array<{ delivered: boolean }>) => items.filter((i) => i.delivered).length;
