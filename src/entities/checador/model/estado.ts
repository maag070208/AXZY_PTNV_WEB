import type { ChecadorDispositivo } from "./types";

/** Estado de la sincronización de un reloj (para su insignia). */
export type ChecadorRelojEstado = "paused" | "running" | "error" | "ok" | "pending";

export const estadoDelReloj = (reloj: ChecadorDispositivo): ChecadorRelojEstado => {
  if (reloj.pausadoPorCredenciales) return "paused";
  if (reloj.enCurso) return "running";
  if (reloj.ultimaCorrida && !reloj.ultimaCorrida.ok) return "error";
  return reloj.sincronizadoEn ? "ok" : "pending";
};

/** Color de la insignia de cada estado. */
export const ESTADO_RELOJ_COLOR: Record<ChecadorRelojEstado, "success" | "warning" | "danger" | "gray" | "info"> = {
  paused: "danger",
  running: "info",
  error: "warning",
  ok: "success",
  pending: "gray",
};
