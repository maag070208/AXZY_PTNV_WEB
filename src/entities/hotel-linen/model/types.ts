/** Tipos de blancos del hotel. Espejo de la API `/hotel` (hotel-store). */

export type HotelProductKind = "CONSUMABLE" | "LINEN" | "CHEMICAL" | "EQUIPMENT";
export type HotelWarehouseKind =
  | "ADMIN"
  | "CENTRAL"
  | "ZONE"
  | "CART"
  | "LAUNDRY"
  | "NEW_LINEN"
  | "POINT"
  | "SPA"
  | "EQUIPMENT";

export const HOTEL_PRODUCT_KINDS: readonly HotelProductKind[] = ["LINEN", "CONSUMABLE", "EQUIPMENT", "CHEMICAL"];
export const HOTEL_WAREHOUSE_KINDS: readonly HotelWarehouseKind[] = [
  "CENTRAL",
  "NEW_LINEN",
  "LAUNDRY",
  "ZONE",
  "POINT",
  "SPA",
  "EQUIPMENT",
  "CART",
  "ADMIN",
];

/** Los decimales de Prisma llegan como texto en el JSON. */
export type Decimal = string | number;

export interface HotelUnit {
  id: string;
  name: string;
  whole: boolean;
  active: boolean;
}

export interface HotelCategory {
  id: string;
  name: string;
  active: boolean;
}

export interface HotelZone {
  id: string;
  name: string;
  kind?: string;
  parentId?: string | null;
}

export interface HotelProduct {
  id: string;
  code: string;
  name: string;
  categoryId: string | null;
  unitId: string;
  supplierId: string | null;
  kind: HotelProductKind;
  minStock: Decimal;
  /** "Par" del hotel: existencia total requerida. */
  idealStock: Decimal;
  overstock: Decimal;
  lastCost: Decimal | null;
  size: string | null;
  tagPrefix: string | null;
  active: boolean;
  unit?: { id: string; name: string; whole: boolean };
  category?: { id: string; name: string } | null;
}

export interface HotelProductInput {
  code: string;
  name: string;
  categoryId?: string | null;
  unitId: string;
  supplierId?: string | null;
  kind?: HotelProductKind;
  minStock?: number;
  idealStock?: number;
  overstock?: number;
  lastCost?: number | null;
  size?: string | null;
  tagPrefix?: string | null;
  active?: boolean;
}

export interface HotelLocation {
  id: string;
  warehouseId: string;
  code: string;
  name: string | null;
  isDefault: boolean;
  active: boolean;
}

export interface HotelPerson {
  id: string;
  name: string;
  employeeNumber?: string | null;
  photoUrl?: string | null;
}

export interface HotelWarehouse {
  id: string;
  code: string;
  name: string;
  kind: HotelWarehouseKind;
  zoneId: string | null;
  zone?: { id: string; name: string } | null;
  ownerId: string | null;
  custodianId: string | null;
  custodian?: HotelPerson | null;
  active: boolean;
  locations: HotelLocation[];
}

export interface HotelWarehouseInput {
  code?: string;
  name: string;
  kind?: HotelWarehouseKind;
  zoneId?: string | null;
  ownerId?: string | null;
  custodianId?: string | null;
  active?: boolean;
}

/* ---------- F1: traspasos, existencias, lotes y límites ---------- */

export type HotelTransferStatus = "IN_TRANSIT" | "ACTIVE" | "RECEIVED_WITH_DIFFERENCE" | "CANCELLED";
export const HOTEL_TRANSFER_STATUSES: readonly HotelTransferStatus[] = [
  "IN_TRANSIT",
  "ACTIVE",
  "RECEIVED_WITH_DIFFERENCE",
  "CANCELLED",
];

export interface HotelWarehouseRef {
  id: string;
  code: string;
  name: string;
  kind: HotelWarehouseKind;
}

export interface HotelUserRef {
  id: string;
  name: string;
}

export interface HotelTransferRow {
  id: string;
  folio: string;
  date: string;
  status: HotelTransferStatus;
  from: HotelWarehouseRef | null;
  to: HotelWarehouseRef | null;
  sentBy: HotelUserRef | null;
  receivedBy: HotelUserRef | null;
  receivedAt: string | null;
  lines: number;
  sentQuantity: number;
  receivedQuantity: number | null;
  difference: number | null;
}

export interface HotelTransferLine {
  id: string;
  product: { id: string; code: string; name: string; size: string | null };
  lot: { id: string; code: string; receivedAt: string } | null;
  fromLocation: { id: string; code: string } | null;
  toLocation: { id: string; code: string } | null;
  quantity: number;
  receivedQuantity: number | null;
  difference: number | null;
}

export interface HotelSignatureEntry {
  role: string;
  method: string;
  signedAt: string;
  user: HotelUserRef;
}

export interface HotelTransferDetail {
  id: string;
  folio: string;
  date: string;
  status: HotelTransferStatus;
  from: HotelWarehouseRef | null;
  to: HotelWarehouseRef | null;
  fromWarehouseId: string | null;
  warehouseId: string | null;
  notes: string | null;
  receiveNotes: string | null;
  sentBy: HotelUserRef | null;
  receivedBy: HotelUserRef | null;
  receivedAt: string | null;
  lines: HotelTransferLine[];
  difference: number | null;
  signatures: HotelSignatureEntry[];
}

export interface HotelTransferSendInput {
  fromWarehouseId: string;
  toWarehouseId: string;
  lines: Array<{
    productId: string;
    quantity: number;
    lotId?: string | null;
    fromLocationId?: string | null;
    toLocationId?: string | null;
  }>;
  notes?: string | null;
  cosignToken?: string | null;
}

export interface HotelTransferReceiveInput {
  lines: Array<{ lineId: string; receivedQuantity: number }>;
  notes?: string | null;
  cosignToken?: string | null;
}

export type HotelStockLight = "green" | "yellow" | "red" | "none";

export interface HotelStockSummaryRow {
  productId: string;
  code: string;
  name: string;
  size: string | null;
  kind: HotelProductKind;
  byWarehouse: Array<{ warehouseId: string; code: string; name: string; kind: string; quantity: number }>;
  byKind: Record<string, number>;
  inTransit: number;
  total: number;
  par: number;
  pct: number | null;
  light: HotelStockLight;
}

export interface HotelLot {
  id: string;
  code: string;
  product: { id: string; code: string; name: string };
  receivedAt: string;
  initialQuantity: number;
  balance: number;
  warehouses: Array<{ warehouseId: string; code: string; name: string; quantity: number }>;
}

export interface HotelWarehouseLimit {
  productId: string;
  product?: { id: string; code: string; name: string };
  minStock: number;
  maxStock: number;
}

export interface HotelCosignResult {
  cosignToken: string;
  expiresIn: number;
  user: { id: string; name: string; username: string };
}
