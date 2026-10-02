import type {
  InvoiceStatus,
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

export const invoiceStatusColor = (status: InvoiceStatus): BadgeColor =>
  status === "CANCELLED" ? "danger" : "success";

/** Cantidad con hasta 3 decimales, sin ceros de sobra (1.250 → 1.25). */
export const fmtQty = (n: number): string => {
  if (n == null || Number.isNaN(n)) return "—";
  return String(Math.round(n * 1000) / 1000);
};

/** Texto de un borrador → valor de `ITInputNumber` (vacío = null). */
export const numOrNull = (v: string | number | null | undefined): number | null =>
  v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v);

/** Valor de `ITInputNumber` → texto del borrador (undefined = vacío). */
export const numText = (v: number | null | undefined): string => (v == null ? "" : String(v));

/** Tasa fracción (0.16 o "0.1600") → "16%". */
export const fmtRate = (rate: number | string): string => `${Math.round(Number(rate) * 10000) / 100}%`;

/** Pesos mexicanos con 2 decimales. */
export const fmtMoney = (n: number): string => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
