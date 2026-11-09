// Tipos del ciclo de lavandería de Blancos (F2): pedidos de área, recepción de sucios, tablero y conciliación.
import type { HotelSignatureEntry, HotelTransferDetail, HotelUserRef, HotelWarehouseRef } from "./types";

export interface LaundryProductRef {
  id: string;
  code: string;
  name: string;
  size: string | null;
}

// ── Pedidos de área ────────────────────────────────────────────────────────

export type SupplyRequestStatus = "DRAFT" | "SUBMITTED" | "PARTIALLY_FULFILLED" | "FULFILLED" | "RECEIVED" | "CANCELLED";
export const SUPPLY_REQUEST_STATUSES: readonly SupplyRequestStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "PARTIALLY_FULFILLED",
  "FULFILLED",
  "RECEIVED",
  "CANCELLED",
];

export interface SupplyRequestRow {
  id: string;
  folio: string;
  date: string;
  shift: string | null;
  status: SupplyRequestStatus;
  area: HotelWarehouseRef;
  source: HotelWarehouseRef;
  requestedBy: HotelUserRef | null;
  lines: number;
  requestedQty: number;
  deliveredQty: number;
  receivedQty: number;
  pendingQty: number;
}

export interface SupplyRequestLine {
  id: string;
  product: LaundryProductRef;
  requestedQty: number;
  deliveredQty: number;
  receivedQty: number;
  pendingQty: number;
  notes: string | null;
}

export interface SupplyRequestDetail {
  id: string;
  folio: string;
  date: string;
  shift: string | null;
  status: SupplyRequestStatus;
  checkouts: number;
  occupied: number;
  notes: string | null;
  area: HotelWarehouseRef;
  source: HotelWarehouseRef;
  requestingWarehouseId: string;
  sourceWarehouseId: string;
  requestedBy: HotelUserRef | null;
  lines: SupplyRequestLine[];
  transfers: HotelTransferDetail[];
  signatures: HotelSignatureEntry[];
}

export interface SupplyRequestInput {
  requestingWarehouseId: string;
  sourceWarehouseId?: string | null;
  date?: string | null;
  shift?: string | null;
  checkouts: number;
  occupied: number;
  notes?: string | null;
  lines: Array<{ productId: string; requestedQty: number; notes?: string | null }>;
}

export interface SupplySuggestion {
  rooms: number;
  checkouts: number;
  occupied: number;
  lines: Array<{
    productId: string;
    averagePerRoom: number;
    quantity: number;
    product: LaundryProductRef | null;
  }>;
}

export interface SupplyFulfillInput {
  lines: Array<{ lineId: string; deliveredQty: number }>;
  cosignToken?: string | null;
}

// ── Recepción de sucios ────────────────────────────────────────────────────

export interface DirtyReceiptRow {
  id: string;
  folio: string;
  date: string;
  cartNumber: string | null;
  shift: string | null;
  origin: HotelWarehouseRef;
  deliveredBy: HotelUserRef | null;
  receivedBy: HotelUserRef | null;
  hasShortage: boolean;
  receivedDirty: number;
  shortage: number;
}

export interface DirtyReceiptLine {
  id: string;
  product: LaundryProductRef;
  deliveredToFloor: number;
  receivedDirty: number;
  stillInUse: number;
  shortage: number;
  good: number;
  stained: number;
  damaged: number;
}

export interface DirtyReceiptDetail {
  id: string;
  folio: string;
  date: string;
  cartNumber: string | null;
  shift: string | null;
  notes: string | null;
  origin: HotelWarehouseRef;
  originWarehouseId: string;
  deliveredBy: HotelUserRef | null;
  receivedBy: HotelUserRef | null;
  hasShortage: boolean;
  movement: { id: string; folio: string } | null;
  lines: DirtyReceiptLine[];
  signatures: HotelSignatureEntry[];
}

export interface DirtyReceiptInput {
  originWarehouseId: string;
  cartNumber?: string | null;
  shift?: string | null;
  date?: string | null;
  notes?: string | null;
  cosignToken: string;
  lines: Array<{
    productId: string;
    receivedDirty: number;
    stillInUse: number;
    good: number;
    stained: number;
    damaged: number;
  }>;
}

export interface DirtyReceiptPrefill {
  warehouse: HotelWarehouseRef;
  date: string;
  lines: Array<{ productId: string; product: LaundryProductRef; deliveredToFloor: number }>;
}

// ── Tablero de lavandería ──────────────────────────────────────────────────

export type LaundryStage = "DIRTY" | "IN_PROCESS" | "CLEAN" | "QUARANTINE";
export const LAUNDRY_STAGES: readonly LaundryStage[] = ["DIRTY", "IN_PROCESS", "CLEAN", "QUARANTINE"];
export type LaundryTreatment = "ORDINARY" | "STAIN";

/** Transiciones válidas del proceso (espejo de la API): nada sale limpio de regreso. */
export const LAUNDRY_TRANSITIONS: Record<string, readonly LaundryStage[]> = {
  DIRTY: ["IN_PROCESS", "QUARANTINE"],
  IN_PROCESS: ["CLEAN", "QUARANTINE"],
  QUARANTINE: ["IN_PROCESS"],
};

export interface LaundryBoardLot {
  lotId: string;
  code: string;
  receivedAt: string;
  initialQuantity: number;
  stages: Record<string, number>;
  washedQuantity: number;
  cycles: number;
}

export interface LaundryBoardProduct {
  product: LaundryProductRef;
  stages: Record<string, number>;
  total: number;
  averageCycles: number;
  lots: LaundryBoardLot[];
}

export interface LaundryBoard {
  warehouse: { id: string; code: string };
  stages: LaundryStage[];
  totals: Record<string, number>;
  products: LaundryBoardProduct[];
}

export interface LaundryMove {
  productId: string;
  lotId?: string | null;
  quantity: number;
  from: "DIRTY" | "IN_PROCESS" | "QUARANTINE";
  to: "IN_PROCESS" | "CLEAN" | "QUARANTINE";
  treatment?: LaundryTreatment | null;
}

export interface FirstWashInput {
  fromWarehouseId?: string | null;
  lines: Array<{ productId: string; quantity: number; lotId?: string | null }>;
  notes?: string | null;
  cosignToken?: string | null;
}

export interface SupplierReturnInput {
  lines: Array<{ productId: string; quantity: number; lotId?: string | null; fromStage: LaundryStage }>;
  notes: string;
  cosignToken?: string | null;
}

// ── Conciliación diaria ────────────────────────────────────────────────────

export interface ReconciliationTotals {
  delivered: number;
  receivedDirty: number;
  stillInUse: number;
  shortage: number;
}

export interface ReconciliationArea {
  warehouse: HotelWarehouseRef;
  receipts: number;
  lines: Array<{
    productId: string;
    product: LaundryProductRef;
    delivered: number;
    receivedDirty: number;
    stillInUse: number;
    shortage: number;
  }>;
  totals: ReconciliationTotals;
}

export interface DailyReconciliation {
  date: string;
  areas: ReconciliationArea[];
  totals: ReconciliationTotals;
}
