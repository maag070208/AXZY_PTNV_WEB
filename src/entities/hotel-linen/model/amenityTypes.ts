// F5: control semanal de amenidades, bodega bajo mínimo y Spa.
export type AmenityControlStatus = "DRAFT" | "SUBMITTED" | "REVIEWED" | "ACKNOWLEDGED";
export const AMENITY_CONTROL_STATUSES: AmenityControlStatus[] = ["DRAFT", "SUBMITTED", "REVIEWED", "ACKNOWLEDGED"];

/** Umbral (%) a partir del cual se revisa la diferencia. */
export const AMENITY_DIFF_THRESHOLD = 10;

export interface AmenityLine {
  product: { id: string; code: string; name: string; unit: string };
  standardPerRoom: number;
  initialStock: number;
  supplied: number;
  extras: number;
  finalStock: number;
  systemFinalStock: number;
  realConsumption: number;
  expectedConsumption: number;
  diffPct: number | null;
  flagged: boolean;
}

export interface AmenityWarehouseRef {
  id: string;
  code: string;
  name: string;
  kind: string;
}

export interface AmenityPreview {
  warehouse: AmenityWarehouseRef;
  weekFrom: string;
  weekTo: string;
  rooms: number;
  occupiedNights: number;
  occupiedNightsOverride: number | null;
  effectiveOccupiedNights: number;
  lines: AmenityLine[];
  existing: { id: string; folio: string; status: AmenityControlStatus } | null;
}

export interface AmenitySignature {
  role: "CONFIRMS" | "REVIEWS" | "AUTHORIZES" | "DELIVERS" | "RECEIVES";
  method: string;
  signedAt: string;
  user: { id: string; name: string };
}

export interface AmenityControlDetail {
  id: string;
  folio: string;
  status: AmenityControlStatus;
  area: AmenityWarehouseRef;
  warehouseId: string;
  weekFrom: string;
  weekTo: string;
  occupiedNights: number;
  occupiedNightsOverride: number | null;
  effectiveOccupiedNights: number;
  notes: string | null;
  flaggedLines: number;
  lines: AmenityLine[];
  signatures: AmenitySignature[];
}

export interface AmenityControlRow {
  id: string;
  folio: string;
  status: AmenityControlStatus;
  area: AmenityWarehouseRef;
  weekFrom: string;
  weekTo: string;
  occupiedNights: number;
  lines: number;
  flaggedLines: number;
}

export interface AmenityControlSaveInput {
  warehouseId: string;
  weekFrom: string;
  occupiedNightsOverride?: number | null;
  notes?: string | null;
  lines: Array<{ productId: string; finalStock: number }>;
}

export interface AmenityLowStockItem {
  warehouse: AmenityWarehouseRef;
  product: { id: string; code: string; name: string; unit: string };
  stock: number;
  minStock: number;
  maxStock: number;
  suggested: number;
}

export interface SpaDailyRow {
  product: { id: string; code: string; name: string; unit: string };
  delivered: number;
  returnedDirty: number;
  inUse: number;
  shortage: number;
  onHand: number;
}

export interface SpaDaily {
  date: string;
  warehouse: AmenityWarehouseRef | null;
  totals: { delivered: number; returnedDirty: number; inUse: number; shortage: number };
  rows: SpaDailyRow[];
}
