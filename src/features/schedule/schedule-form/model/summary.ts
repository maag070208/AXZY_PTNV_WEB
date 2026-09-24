import type { HorarioDiaInput } from "@entities/schedule";

const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/** Espeja la fórmula del backend (`horario.service.ts`): `diff > 0 ? diff : diff + 1440`. */
export const minutesBetween = (from: string | null, to: string | null): number => {
  if (!from || !to) return 0;
  const diff = toMinutes(to) - toMinutes(from);
  return diff > 0 ? diff : diff + 24 * 60;
};

/** Minutos de la jornada de un día, descontando la comida. `0` si es descanso. */
export const dayMinutes = (d: HorarioDiaInput, comidaMin: number): number => {
  if (d.descanso) return 0;
  const span = minutesBetween(d.entrada ?? null, d.salida ?? null);
  const second = d.entrada2 && d.salida2 ? minutesBetween(d.entrada2, d.salida2) : 0;
  return Math.max(0, span + second - comidaMin);
};

/** Suma de minutos de todos los días de la semana. */
export const weeklyMinutes = (dias: HorarioDiaInput[], comidaMin: number): number =>
  dias.reduce((total, d) => total + dayMinutes(d, comidaMin), 0);

/** Cantidad de días marcados como laborables. */
export const daysWorked = (dias: HorarioDiaInput[]): number =>
  dias.filter((d) => !d.descanso).length;

/** Cantidad de días marcados como descanso. */
export const restDays = (dias: HorarioDiaInput[]): number =>
  dias.filter((d) => d.descanso).length;
