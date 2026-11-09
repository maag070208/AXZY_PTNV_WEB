import type { HotelWarehouseKind } from "@entities/hotel-linen";

export const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n);
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("es-MX");
export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("es-MX");

/** "YYYY-MM-DD" <-> Date local (sin pasar por UTC, para no correr el día). */
export const localToDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayStr = (): string => localToDateStr(new Date());
export const dateStrToLocal = (value: string): Date | undefined => {
  const [y, m, d] = value.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
};

/** Áreas que piden blancos y de las que se reciben sucios. */
export const AREA_KINDS: readonly HotelWarehouseKind[] = ["ZONE", "SPA", "POINT"];

export const SHIFTS = ["MORNING", "AFTERNOON", "NIGHT"] as const;
