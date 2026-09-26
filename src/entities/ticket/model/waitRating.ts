export type RatingEspera = "EXCELENTE" | "BUENO" | "REGULAR" | "MALO";

export const RATING_ESPERA_COLOR: Record<RatingEspera, string> = {
  EXCELENTE: "success",
  BUENO: "info",
  REGULAR: "warning",
  MALO: "danger",
};

const DAY_MS = 86_400_000;

export const diasEnEspera = (creadoEn: string, cerradoEn?: string | null): number => {
  const desde = new Date(creadoEn).getTime();
  const hasta = cerradoEn ? new Date(cerradoEn).getTime() : Date.now();
  return Math.max(1, Math.floor((hasta - desde) / DAY_MS));
};

export const ratingEspera = (dias: number): RatingEspera => {
  if (dias > 12) return "MALO";
  if (dias > 7) return "REGULAR";
  if (dias > 3) return "BUENO";
  return "EXCELENTE";
};