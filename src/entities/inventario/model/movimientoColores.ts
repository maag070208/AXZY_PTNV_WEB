import type { TipoMovimiento } from "./types";

export type BadgeColor = "success" | "warning" | "danger" | "gray" | "info";

export const TIPO_BADGE_COLOR: Record<TipoMovimiento, BadgeColor> = {
  ENTRADA: "success",
  PRESTAMO: "warning",
  DEVOLUCION: "info",
  BAJA: "danger",
  TRASPASO: "info",
  AJUSTE_ENTRADA: "success",
  AJUSTE_SALIDA: "warning",
  MANTENIMIENTO_ENTRADA: "gray",
  MANTENIMIENTO_SALIDA: "info",
  REVERSION: "danger",
};

export const TIPO_BADGE_HEX: Record<TipoMovimiento, string> = {
  ENTRADA: "#10b981",
  PRESTAMO: "#f59e0b",
  DEVOLUCION: "#0ea5e9",
  BAJA: "#ef4444",
  TRASPASO: "#0ea5e9",
  AJUSTE_ENTRADA: "#10b981",
  AJUSTE_SALIDA: "#f59e0b",
  MANTENIMIENTO_ENTRADA: "#64748b",
  MANTENIMIENTO_SALIDA: "#0ea5e9",
  REVERSION: "#ef4444",
};