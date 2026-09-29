import type {
  KitchenMovementType,
  LotStatus,
  MovementStatus,
  PurchaseOrderStatus,
  StockStatus,
} from "./types";

export type BadgeColor = "success" | "warning" | "danger" | "gray" | "info";

/** Colores de `ITBadget` por estado (los usan las tablas de cocina). */
export const stockStatusColor = (status: StockStatus): BadgeColor =>
  status === "LOW" ? "warning" : status === "OVER" ? "info" : "success";

export const lotStatusColor = (status: LotStatus): BadgeColor =>
  status === "EXPIRED" ? "danger" : status === "EXPIRING" ? "warning" : status === "EMPTY" ? "gray" : "success";

export const movementTypeColor = (type: KitchenMovementType): BadgeColor =>
  type === "STOCK_IN" || type === "ADJUSTMENT_IN"
    ? "success"
    : type === "CONSUMPTION"
      ? "info"
      : type === "REVERSAL"
        ? "gray"
        : "danger";

export const movementStatusColor = (status: MovementStatus): BadgeColor =>
  status === "CANCELLED" ? "danger" : "success";

export const purchaseOrderStatusColor = (status: PurchaseOrderStatus): BadgeColor =>
  status === "DRAFT"
    ? "gray"
    : status === "APPROVED"
      ? "info"
      : status === "SENT"
        ? "info"
        : status === "PARTIALLY_RECEIVED"
          ? "warning"
          : status === "RECEIVED"
            ? "success"
            : "danger";

/** Cantidad con hasta 3 decimales, sin ceros de sobra (1.250 → 1.25). */
export const fmtQty = (n: number): string => {
  if (n == null || Number.isNaN(n)) return "—";
  return String(Math.round(n * 1000) / 1000);
};
