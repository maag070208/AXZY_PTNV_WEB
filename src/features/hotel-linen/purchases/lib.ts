export const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const qty = (n: number) => n.toLocaleString("es-MX", { maximumFractionDigits: 3 });
export const pct = (rate: number) => `${Math.round(rate * 10000) / 100}%`;
/** Fecha del calendario ("2026-11-08") o instante ISO -> texto local. */
export const day = (iso: string | null) => (iso ? new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("es-MX") : "—");
export const dateTime = (iso: string) => new Date(iso).toLocaleString("es-MX");


/** "YYYY-MM-DD" <-> Date local (sin pasar por UTC, para no correr el día). */
export const localToDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayStr = (): string => localToDateStr(new Date());
export const dateStrToLocal = (value: string): Date | undefined => {
  const [y, m, d] = value.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
};
