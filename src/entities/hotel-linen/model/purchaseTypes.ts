/** Tipos de compras de blancos (F6). Espejo de la API `/hotel/linen/purchases`. */

export const PURCHASE_ORDER_STATUSES = ["DRAFT", "APPROVED", "PARTIALLY_RECEIVED", "RECEIVED", "CLOSED", "CANCELLED"] as const;
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];
export const PURCHASE_HOLD_STATUSES = ["OPEN", "RETURNED", "ACCEPTED"] as const;
export type PurchaseHoldStatus = (typeof PURCHASE_HOLD_STATUSES)[number];
export const PURCHASE_REQUEST_SOURCES = ["WEEKLY_WRITEOFFS", "LOW_STOCK", "MANUAL"] as const;
export type PurchaseRequestSource = (typeof PURCHASE_REQUEST_SOURCES)[number];
export const PURCHASE_REQUEST_STATUSES = ["OPEN", "CONVERTED", "DISMISSED"] as const;
export type PurchaseRequestStatus = (typeof PURCHASE_REQUEST_STATUSES)[number];

export interface PurchaseUserRef {
  id: string;
  name: string | null;
}

export interface PurchaseTaxBreakdown {
  rate: number;
  base: number;
  tax: number;
}

export interface PurchaseTotals {
  subtotal: number;
  tax: number;
  total: number;
}

export interface PurchaseOrderRow extends PurchaseTotals {
  id: string;
  folio: string;
  status: PurchaseOrderStatus;
  supplier: { id: string; name: string } | null;
  warehouse: { id: string; code: string; name: string } | null;
  expectedDate: string | null;
  createdBy: PurchaseUserRef | null;
  createdAt: string;
  lineCount: number;
  pendingQuantity: number;
}

export interface PurchaseOrderLine {
  id: string;
  product: { id: string; code: string; name: string; size: string | null; unit: string };
  quantity: number;
  receivedQuantity: number;
  pendingQuantity: number;
  unitCost: number;
  taxRateId: string | null;
  taxRate: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface PurchaseReceiptSummary {
  id: string;
  invoiceNumber: string;
  date: string;
  receivedBy: PurchaseUserRef | null;
  notes: string | null;
  lines: Array<{ orderLineId: string; receivedQty: number; acceptedQty: number; heldQty: number; lot: string | null }>;
}

export interface PurchaseOrderDetail extends PurchaseTotals {
  id: string;
  folio: string;
  status: PurchaseOrderStatus;
  supplier: { id: string; name: string; legalName: string | null; rfc: string | null; email: string | null; phone: string | null } | null;
  warehouse: { id: string; code: string; name: string } | null;
  expectedDate: string | null;
  notes: string | null;
  closeNotes: string | null;
  createdBy: PurchaseUserRef | null;
  createdAt: string;
  approvedBy: PurchaseUserRef | null;
  approvedAt: string | null;
  closedBy: PurchaseUserRef | null;
  closedAt: string | null;
  lines: PurchaseOrderLine[];
  taxes: PurchaseTaxBreakdown[];
  receipts: PurchaseReceiptSummary[];
}

export interface PurchaseOrderInput {
  supplierId?: string | null;
  warehouseId?: string | null;
  expectedDate?: string | null;
  notes?: string | null;
  lines: Array<{ productId: string; quantity: number; unitCost?: number | null; taxRateId?: string | null }>;
}

export interface PurchaseReceiptInput {
  invoiceNumber: string;
  lines: Array<{ lineId: string; receivedQty: number; acceptedQty: number; heldQty: number; holdReason?: string | null }>;
  notes?: string | null;
}

export interface PurchaseLookups {
  suppliers: Array<{ id: string; name: string }>;
  taxRates: Array<{ id: string; name: string; rate: number }>;
}

export interface PurchaseHoldRow {
  id: string;
  status: PurchaseHoldStatus;
  product: { id: string; code: string; name: string; size: string | null };
  quantity: number;
  unitCost: number;
  reason: string;
  dueAt: string;
  overdue: boolean;
  createdAt: string;
  invoiceNumber: string;
  order: { id: string; folio: string; supplier: { id: string; name: string } | null };
  resolvedBy: PurchaseUserRef | null;
  resolvedAt: string | null;
}

export interface PurchaseRequestRow {
  id: string;
  folio: string;
  source: PurchaseRequestSource;
  status: PurchaseRequestStatus;
  weekFrom: string | null;
  weekTo: string | null;
  notes: string | null;
  createdBy: PurchaseUserRef | null;
  createdAt: string;
  purchaseOrder: { id: string; folio: string; status: PurchaseOrderStatus } | null;
  lines: Array<{ id: string; product: { id: string; code: string; name: string; size: string | null }; quantity: number; reason: string | null }>;
}

export interface PurchaseGenerateResult {
  created: boolean;
  request: PurchaseRequestRow | null;
}
