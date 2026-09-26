import type { MovementType } from "./types";

export type BadgeColor = "success" | "warning" | "danger" | "gray" | "info";

export const TYPE_BADGE_COLOR: Record<MovementType, BadgeColor> = {
  STOCK_IN: "success",
  LOAN: "warning",
  RETURN: "info",
  RETIREMENT: "danger",
  TRANSFER: "info",
  ADJUSTMENT_IN: "success",
  ADJUSTMENT_OUT: "warning",
  MAINTENANCE_IN: "gray",
  MAINTENANCE_OUT: "info",
  REVERSAL: "danger",
};

export const TYPE_BADGE_HEX: Record<MovementType, string> = {
  STOCK_IN: "#10b981",
  LOAN: "#f59e0b",
  RETURN: "#0ea5e9",
  RETIREMENT: "#ef4444",
  TRANSFER: "#0ea5e9",
  ADJUSTMENT_IN: "#10b981",
  ADJUSTMENT_OUT: "#f59e0b",
  MAINTENANCE_IN: "#64748b",
  MAINTENANCE_OUT: "#0ea5e9",
  REVERSAL: "#ef4444",
};