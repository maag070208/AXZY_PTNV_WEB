import type { CondicionType, MovementType } from "./types";

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  TRASLADO: "Traslado",
  BAJA: "Baja",
  PRESTAMO: "Asignado",
  DEVOLUCION: "Devolución",
};

export const MOVEMENT_TYPE_TITLES: Record<MovementType, string> = {
  ENTRADA: "Entrada (alta en inventario)",
  SALIDA: "Salida (retirar de ubicación)",
  TRASLADO: "Traslado (mover a otra ubicación)",
  BAJA: "Baja (dar de baja el dispositivo)",
  PRESTAMO: "Asignado (equipo entregado a alguien)",
  DEVOLUCION: "Devolución (equipo regresado de asignación)",
};

export const CONDITION_LABELS: Record<CondicionType, string> = {
  BUENO: "Bueno",
  ACEPTABLE: "Aceptable",
  MALO: "Malo",
  ROTO: "Roto",
};