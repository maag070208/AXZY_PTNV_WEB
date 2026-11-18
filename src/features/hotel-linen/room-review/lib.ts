export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("es-MX");

/** "YYYY-MM-DD" <-> Date local (sin pasar por UTC, para no correr el día). */
export const localToDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const dateStrToLocal = (value: string): Date | undefined => {
  const [y, m, d] = value.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
};

/** Periodo por defecto del consolidado: de lunes a domingo de la semana actual. */
export const defaultPeriod = (): { from: string; to: string } => {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  return {
    from: localToDateStr(monday),
    to: localToDateStr(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)),
  };
};

/** "YYYY-MM-DD" → inicio (o fin) del día local como instante ISO para la API. */
export const dayBoundIso = (day: string, end: boolean): string => {
  const [y, m, d] = day.split("-").map(Number);
  return (end ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d, 0, 0, 0, 0)).toISOString();
};
