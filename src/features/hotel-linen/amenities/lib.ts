import { AMENITY_DIFF_THRESHOLD, type AmenityLine } from "@entities/hotel-linen";

export const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n);
export const fmtPct = (n: number | null) => (n === null ? "—" : `${new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 }).format(n)}%`);
/** Fecha `AAAA-MM-DD` (o ISO) -> dd/mm/aaaa sin correr el día por la zona. */
export const fmtDay = (value: string) => {
  const [y, m, d] = value.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};
export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("es-MX");

export const localToDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayStr = (): string => localToDateStr(new Date());
export const dateStrToLocal = (value: string): Date | undefined => {
  const [y, m, d] = value.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
};
export const shiftDays = (value: string, days: number): string => {
  const d = dateStrToLocal(value) ?? new Date();
  d.setDate(d.getDate() + days);
  return localToDateStr(d);
};

const round = (n: number, decimals: number) => Math.round((n + Number.EPSILON) * 10 ** decimals) / 10 ** decimals;

/** Mismas fórmulas que el API: real = inicial + surtido − final; esperado = ocupadas × estándar + extras. */
export const computeLine = (nights: number, line: AmenityLine, finalStock: number): AmenityLine => {
  const realConsumption = round(line.initialStock + line.supplied - finalStock, 3);
  const expectedConsumption = round(nights * line.standardPerRoom + line.extras, 3);
  const diffPct = expectedConsumption > 0 ? round(((realConsumption - expectedConsumption) / expectedConsumption) * 100, 2) : null;
  const flagged = diffPct === null ? realConsumption !== 0 : Math.abs(diffPct) > AMENITY_DIFF_THRESHOLD;
  return { ...line, finalStock, realConsumption, expectedConsumption, diffPct, flagged };
};
