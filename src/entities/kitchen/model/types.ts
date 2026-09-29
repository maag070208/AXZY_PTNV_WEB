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

// ── Tasas de IVA ────────────────────────────────────────────────────────────

/** Tasa de IVA del catálogo; `rate` es fracción (0.16 = 16%). */
export interface TaxRate {
  id: string;
  name: string;
  rate: number | string;
  active: boolean;
  sortOrder: number;
}

export interface TaxRateInput {
  name: string;
  rate: number;
  active?: boolean;
}

// ── Proveedores ─────────────────────────────────────────────────────────────

export interface SupplierContact {
  id?: string;
  name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
  notes: string | null;
}

/** Datos del proveedor (fiscales, ubicación y condiciones). */
export interface SupplierFields {
  name: string;
  legalName: string | null;
  rfc: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  street: string | null;
  neighborhood: string | null;
  postalCode: string | null;
  city: string | null;
  state: string | null;
  locationNotes: string | null;
  mapsUrl: string | null;
  /** Días de crédito (0 = contado). */
  paymentTermsDays: number | null;
  /** Días de entrega desde que se envía la OC. */
  leadTimeDays: number | null;
  notes: string | null;
}

export interface Supplier extends SupplierFields {
  id: string;
  active: boolean;
  /** Solo el principal (la lista simple y la tabla lo traen). */
  contacts?: SupplierContact[];
}

export interface SupplierRow extends Supplier {
  primaryContact: SupplierContact | null;
  contactsCount: number;
  itemsCount: number;
}

/** Artículo que surte el proveedor: 1 `purchaseUnit` = `factor` unidades base. */
export interface SupplierItem {
  id: string;
  item: KitchenItemRef & { active: boolean; unit: KitchenUnit };
  supplierCode: string | null;
  purchaseUnit: string;
  factor: number;
  /** Último precio por unidad de compra (lo actualiza la factura). */
  lastUnitCost: number | null;
  lastPurchasedAt: string | null;
}

export interface SupplierDetail extends Supplier {
  contacts: SupplierContact[];
  items: SupplierItem[];
  purchaseOrders: Array<{ id: string; number: string; status: PurchaseOrderStatus; createdAt: string; expectedAt: string | null }>;
  invoices: Array<{ id: string; number: string; date: string; total: number; status: InvoiceStatus }>;
  createdAt: string;
}

export interface SupplierItemInput {
  itemId: string;
  supplierCode?: string | null;
  purchaseUnit: string;
  factor: number;
  lastUnitCost?: number | null;
}

export interface SupplierInput extends Partial<SupplierFields> {
  name: string;
  active?: boolean;
  contacts?: Array<Omit<SupplierContact, "id">>;
  items?: SupplierItemInput[];
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
  defaultTaxRateId: string | null;
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
  defaultTaxRateId?: string | null;
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
  /** Valor del inventario del artículo (saldo de lotes × costo). */
  stockValue: number;
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
  /** Lo pedido en órdenes de compra abiertas y aún no recibido. */
  inTransit: number;
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

// ── Órdenes de compra (F3) ──────────────────────────────────────────────────

export type PurchaseOrderStatus =
  | "DRAFT"
  | "APPROVED"
  | "SENT"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

export const PURCHASE_ORDER_STATUSES: readonly PurchaseOrderStatus[] = [
  "DRAFT",
  "APPROVED",
  "SENT",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
];

export interface PurchaseOrderRow {
  id: string;
  number: string;
  supplier: { id: string; name: string };
  costCenter: { id: string; name: string; code: string } | null;
  status: PurchaseOrderStatus;
  expectedAt: string | null;
  createdAt: string;
  createdBy: { id: string; name: string };
  linesCount: number;
  orderedUnits: number;
  receivedUnits: number;
  /** Antes de IVA. */
  subtotal: number;
  tax: number;
  total: number;
  /** IVA desglosado por tasa. */
  taxes: Array<{ rate: number; base: number; tax: number }>;
}

export interface PurchaseOrderLine {
  id: string;
  item: KitchenItemRef & { tracksExpiry: boolean; unit: KitchenUnit };
  quantity: number;
  unitCost: number | null;
  receivedQuantity: number;
  pendingQuantity: number;
  /** Disponible hoy del artículo. */
  available: number;
  /** Lo pedido en OTRAS órdenes abiertas (sin contar esta línea). */
  inTransit: number;
  notes: string | null;
  /** Presentación con que se pidió (null = en unidad base). */
  purchaseUnit: string | null;
  purchaseFactor: number | null;
  purchaseQuantity: number | null;
  taxRateId: string | null;
  /** Fracción (0.16). */
  taxRate: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface PurchaseOrderDetail extends Omit<PurchaseOrderRow, "supplier"> {
  supplier: {
    id: string;
    name: string;
    legalName: string | null;
    rfc: string | null;
    street: string | null;
    neighborhood: string | null;
    postalCode: string | null;
    city: string | null;
    state: string | null;
    phone: string | null;
    email: string | null;
    paymentTermsDays: number | null;
    leadTimeDays: number | null;
    primaryContact: Omit<SupplierContact, "id" | "isPrimary" | "notes"> | null;
  };
  approvedBy: { id: string; name: string } | null;
  approvedAt: string | null;
  sentAt: string | null;
  notes: string | null;
  lines: PurchaseOrderLine[];
  movements: Array<{ id: string; date: string; reference: string | null; createdBy: string }>;
}

export interface PurchaseOrderLineInput {
  itemId: string;
  quantity: number;
  unitCost?: number | null;
  notes?: string | null;
  /** `quantity`/`unitCost` vienen en la unidad de compra del proveedor. */
  usePurchaseUnit?: boolean;
  /** Tasa de IVA; null = sin IVA; ausente = la del artículo. */
  taxRateId?: string | null;
}

export interface PurchaseOrderInput {
  supplierId: string;
  costCenterId?: string | null;
  expectedAt?: string | null;
  notes?: string | null;
  lines: PurchaseOrderLineInput[];
}

export interface PurchaseOrderReceiveLineInput {
  lineId: string;
  quantity: number;
  lotCode?: string;
  expiresAt?: string | null;
  unitCost?: number | null;
}

export interface PurchaseOrderReceiveInput {
  date?: string;
  reference?: string | null;
  notes?: string | null;
  lines: PurchaseOrderReceiveLineInput[];
}

// ── Facturas de proveedor (F4) ──────────────────────────────────────────────

export type InvoiceStatus = "ACTIVE" | "CANCELLED";

export const INVOICE_STATUSES: readonly InvoiceStatus[] = ["ACTIVE", "CANCELLED"];

export interface SupplierInvoiceRow {
  id: string;
  number: string;
  uuid: string | null;
  supplier: { id: string; name: string };
  purchaseOrder: { id: string; number: string } | null;
  date: string;
  total: number;
  status: InvoiceStatus;
  createdBy: { id: string; name: string };
}

export interface SupplierInvoiceLine {
  id: string;
  item: KitchenItemRef & { unit: KitchenUnit };
  purchaseOrderLineId: string | null;
  quantity: number;
  unitCost: number;
  /** Cotejo de tres vías (null si el renglón no está ligado a una OC). */
  ordered: number | null;
  received: number | null;
  invoicedQuantity: number | null;
  /** Diferencia de precio contra lo pactado en la OC. */
  priceDiff: number | null;
  /** IVA del renglón facturado. */
  taxRateId: string | null;
  taxRate: number;
  tax: number;
  /** Tasa del renglón de la OC (null si no hay OC). */
  poTaxRate: number | null;
  taxRateDiff: number | null;
  taxDiff: number | null;
}

/** Totales de IVA de la factura comparados contra la OC. */
export interface InvoiceTaxTotals {
  subtotal: number;
  tax: number;
  total: number;
  byRate: Array<{ rate: number; base: number; tax: number }>;
  order: {
    subtotal: number;
    tax: number;
    total: number;
    byRate: Array<{ rate: number; base: number; tax: number }>;
  } | null;
  taxDiff: number | null;
}

export interface SupplierInvoiceDetail extends SupplierInvoiceRow {
  subtotal: number | null;
  tax: number | null;
  notes: string | null;
  createdAt: string;
  taxTotals: InvoiceTaxTotals;
  lines: SupplierInvoiceLine[];
}

export interface SupplierInvoiceLineInput {
  itemId: string;
  purchaseOrderLineId?: string | null;
  quantity: number;
  unitCost: number;
  /** Tasa de IVA; null = sin IVA; ausente = la del renglón de la OC. */
  taxRateId?: string | null;
}

export interface SupplierInvoiceInput {
  supplierId: string;
  purchaseOrderId?: string | null;
  number: string;
  uuid?: string | null;
  date: string;
  subtotal?: number | null;
  tax?: number | null;
  total: number;
  notes?: string | null;
  lines: SupplierInvoiceLineInput[];
}

// ── Centros de costo (NEXT_STEPS_PLAN 1.4) ──────────────────────────────────

export interface CostCenter {
  id: string;
  name: string;
  code: string;
  department: { id: string; name: string } | null;
  active: boolean;
}

export interface CostCenterInput {
  name: string;
  code: string;
  departmentId?: string | null;
  active?: boolean;
}

/** Fila del reporte de gasto por centro de costo. */
export interface CostCenterSpendingRow {
  costCenter: { id: string; name: string; code: string } | null;
  orders: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface CostCenterSpending {
  from: string | null;
  to: string | null;
  rows: CostCenterSpendingRow[];
  totals: { orders: number; subtotal: number; tax: number; total: number };
}
