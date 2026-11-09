export const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n);
export const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("es-MX");
export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("es-MX");

/** "YYYY-MM-DD" <-> Date local (sin pasar por UTC, para no correr el día). */
export const localToDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const dateStrToLocal = (value: string): Date | undefined => {
  const [y, m, d] = value.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
};
/** Lunes de la semana de `d`. */
export const mondayOf = (d: Date): Date => {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
  return out;
};
