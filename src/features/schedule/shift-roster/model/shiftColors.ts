import type { CSSProperties } from "react";

/**
 * Colores por turno como estilos directos: el tema de Tailwind del proyecto no
 * genera toda la paleta (violet, orange, lime… salían en blanco). Ámbar queda
 * reservado a «sin guardar».
 */
export type Tone = Pick<CSSProperties, "background" | "color" | "borderColor">;

const PALETTE: Tone[] = [
  { background: "#e0f2fe", color: "#075985", borderColor: "#7dd3fc" }, // azul cielo
  { background: "#dcfce7", color: "#166534", borderColor: "#86efac" }, // verde
  { background: "#ede9fe", color: "#5b21b6", borderColor: "#c4b5fd" }, // violeta
  { background: "#ffe4e6", color: "#9f1239", borderColor: "#fda4af" }, // rosa
  { background: "#ffedd5", color: "#9a3412", borderColor: "#fdba74" }, // naranja
  { background: "#ccfbf1", color: "#115e59", borderColor: "#5eead4" }, // turquesa
  { background: "#e0e7ff", color: "#3730a3", borderColor: "#a5b4fc" }, // índigo
  { background: "#ecfccb", color: "#3f6212", borderColor: "#bef264" }, // lima
  { background: "#fae8ff", color: "#86198f", borderColor: "#f0abfc" }, // fucsia
  { background: "#cffafe", color: "#155e75", borderColor: "#67e8f9" }, // cian
  { background: "#fee2e2", color: "#991b1b", borderColor: "#fca5a5" }, // rojo
  { background: "#f5f5f4", color: "#44403c", borderColor: "#a8a29e" }, // piedra
];

export const REST_TONE: Tone = { background: "#e2e8f0", color: "#334155", borderColor: "#94a3b8" };
export const BASE_TONE: Tone = { background: "#ffffff", color: "#475569", borderColor: "#cbd5e1" };

/** Color estable por horario: posición en la lista ordenada por id. */
export const buildToneMap = (ids: string[]): Map<string, Tone> => {
  const map = new Map<string, Tone>();
  [...ids].sort().forEach((id, i) => map.set(id, PALETTE[i % PALETTE.length]));
  return map;
};
