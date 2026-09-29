/** Tipos del almacén de cocina (KITCHEN_STORE.md). Espejo de la API `/kitchen`. */

export type KitchenItemKind = "CONSUMABLE" | "DURABLE";
export type KitchenStorage = "DRY" | "REFRIGERATED" | "FROZEN";
export type KitchenMovementType =
  | "STOCK_IN"
  | "CONSUMPTION"
  | "WASTE"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "REVERSAL";
export type KitchenWasteReason = "EXPIRED" | "SPOILED" | "BREAKAGE" | "LOSS" | "OTHER";
export type StockStatus = "LOW" | "OK" | "OVER";
export type LotStatus = "VALID" | "EXPIRING" | "EXPIRED" | "EMPTY";
export type MovementStatus = "ACTIVE" | "CANCELLED";

export const KITCHEN_ITEM_KINDS: readonly KitchenItemKind[] = ["CONSUMABLE", "DURABLE"];
export const KITCHEN_STORAGES: readonly KitchenStorage[] = ["DRY", "REFRIGERATED", "FROZEN"];
export const KITCHEN_MOVEMENT_TYPES: readonly KitchenMovementType[] = [
  "STOCK_IN",
  "CONSUMPTION",
  "WASTE",
  "ADJUSTMENT_IN",
  "ADJUSTMENT_OUT",
  "REVERSAL",
];
export const KITCHEN_WASTE_REASONS: readonly KitchenWasteReason[] = [
  "EXPIRED",
  "SPOILED",
  "BREAKAGE",
  "LOSS",
  "OTHER",
];
export const STOCK_STATUSES: readonly StockStatus[] = ["LOW", "OK", "OVER"];
export const LOT_STATUSES: readonly LotStatus[] = ["VALID", "EXPIRING", "EXPIRED", "EMPTY"];

export interface KitchenCategory {
  id: string;
  name: string;
  active: boolean;
}

/** Unidad de medida del catálogo (kg, pieza, caja…). `whole` = discreta. */
export interface KitchenUnit {
  id: string;
  code: string;
  name: string;
  whole: boolean;
  active?: boolean;
}

export interface KitchenUnitInput {
  code: string;
  name: string;
  whole: boolean;
  active?: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  rfc: string | null;
  contact: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
}

export interface KitchenItemRef {
  id: string;
  code: string;
  name: string;
  unit: KitchenUnit;
}

export interface KitchenItemRow {
  id: string;
  code: string;
  name: string;
  category: { id: string; name: string };
  kind: KitchenItemKind;
  unit: KitchenUnit;
  storage: KitchenStorage;
  tracksExpiry: boolean;
  minStock: number;
  maxStock: number | null;
  active: boolean;
  available: number;
  expired: number;
  nextExpiry: string | null;
  stockStatus: StockStatus;
}

export interface KitchenItemInput {
  code: string;
  name: string;
  categoryId: string;
  kind: KitchenItemKind;
  unitId: string;
  storage: KitchenStorage;
  tracksExpiry: boolean;
  minStock: number;
  maxStock: number | null;
  notes?: string | null;
  active?: boolean;
}

export interface KitchenLotRow {
  id: string;
  lotCode: string;
  item: KitchenItemRef & { category: { id: string; name: string } };
  supplier: { id: string; name: string } | null;
  expiresAt: string | null;
  receivedAt: string;
  quantityIn: number;
  onHand: number;
  unitCost: number | null;
  status: LotStatus;
}

export interface KitchenItemDetail {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  category: { id: string; name: string };
  kind: KitchenItemKind;
  unitId: string;
  unit: KitchenUnit;
  storage: KitchenStorage;
  tracksExpiry: boolean;
  minStock: number;
  maxStock: number | null;
  notes: string | null;
  active: boolean;
  available: number;
  expired: number;
  nextExpiry: string | null;
  stockStatus: StockStatus;
  suggested: number;
  lots: Array<{
    id: string;
    lotCode: string;
    expiresAt: string | null;
    receivedAt: string;
    supplier: { id: string; name: string } | null;
    unitCost: number | null;
    quantityIn: number;
    onHand: number;
    status: LotStatus;
  }>;
  movements: Array<{
    movementId: string;
    type: KitchenMovementType;
    status: MovementStatus;
    wasteReason: KitchenWasteReason | null;
    date: string;
    createdBy: string;
    lotCode: string;
    quantity: number;
  }>;
}

export interface KitchenMovementLine {
  id: string;
  item: KitchenItemRef;
  lot: { id: string; lotCode: string; expiresAt: string | null };
  quantity: number;
  unitCost: number | null;
}

export interface KitchenMovement {
  id: string;
  type: KitchenMovementType;
  date: string;
  status: MovementStatus;
  reference: string | null;
  notes: string | null;
  wasteReason: KitchenWasteReason | null;
  reversalOfId: string | null;
  createdBy: { id: string; name: string };
  lines: KitchenMovementLine[];
}

export interface FefoAllocation {
  lotId: string;
  lotCode: string;
  expiresOn: string | null;
  quantity: number;
}

export interface FefoLine {
  itemId: string;
  code: string;
  name: string;
  unit: KitchenUnit;
  quantity: number;
  allocations: FefoAllocation[];
  missing: number;
}

export interface FefoPreview {
  today: string;
  lines: FefoLine[];
}

export interface KitchenStockInInput {
  date?: string;
  reference?: string | null;
  notes?: string | null;
  supplierId?: string | null;
  lines: Array<{
    itemId: string;
    quantity: number;
    lotCode?: string;
    expiresAt?: string | null;
    unitCost?: number | null;
  }>;
}

export interface KitchenStockOutInput {
  date?: string;
  reference?: string | null;
  notes?: string | null;
  type: "CONSUMPTION" | "WASTE";
  wasteReason?: KitchenWasteReason;
  lines: Array<{ itemId: string; quantity: number; lotId?: string }>;
}

export interface KitchenAdjustmentInput {
  date?: string;
  reference?: string | null;
  notes?: string | null;
  type: "ADJUSTMENT_IN" | "ADJUSTMENT_OUT";
  lines: Array<{ itemId: string; lotId: string; quantity: number }>;
}

export interface FefoPreviewInput {
  type?: "CONSUMPTION" | "WASTE";
  lines: Array<{ itemId: string; quantity: number }>;
}

export interface RestockRow {
  id: string;
  code: string;
  name: string;
  category: { id: string; name: string };
  unit: KitchenUnit;
  available: number;
  minStock: number;
  maxStock: number | null;
  stockStatus: StockStatus;
  suggested: number;
}

export interface KitchenAlertItem {
  id: string;
  code: string;
  name: string;
  unit: KitchenUnit;
  available: number;
  minStock: number;
  maxStock: number | null;
  stockStatus: StockStatus;
}

export interface KitchenAlertLot {
  id: string;
  lotCode: string;
  item: KitchenItemRef;
  expiresAt: string;
  onHand: number;
}

export interface KitchenAlerts {
  today: string;
  warningDays: number;
  counts: { low: number; over: number; expiring: number; expired: number };
  low: KitchenAlertItem[];
  over: KitchenAlertItem[];
  expiring: KitchenAlertLot[];
  expired: KitchenAlertLot[];
}
