export const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n);
export const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const pct = (n: number | null) => (n === null ? "—" : `${new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 }).format(n)}%`);
export const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("es-MX");
export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("es-MX");

/** "YYYY-MM-DD" <-> Date local (sin pasar por UTC, para no correr el día). */
export const localToDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const dateStrToLocal = (value: string): Date | undefined => {
  const [y, m, d] = value.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
};
export const todayStr = (): string => localToDateStr(new Date());
/** Inicio del periodo por defecto: 30 días atrás (igual que el API). */
export const defaultFrom = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return localToDateStr(d);
};
export const productLabel = (p: { name: string; size?: string | null }) => (p.size ? `${p.name} · ${p.size}` : p.name);
