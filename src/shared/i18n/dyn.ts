import type { TFunction } from "i18next";

type LooseTranslate = (key: string, options?: Record<string, unknown>) => string;

// Texto legible para el último segmento de la clave (MATUTINO -> "Matutino", IN_TRANSIT -> "In transit").
const humanize = (key: string): string => {
  const last = key.split(".").pop() ?? key;
  const s = last.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// Traducción dinámica: si la clave no existe muestra un texto legible, nunca la clave cruda.
export const dyn =
  (tt: TFunction<any>): LooseTranslate =>
  (key, options) =>
    (tt as LooseTranslate)(key, { defaultValue: humanize(key), ...options });
