import type { HotelStockLight } from "./types";

// ── Tablero ────────────────────────────────────────────────────────────────

export interface LinenDashboard {
  generatedAt: string;
  transfers: { inTransit: number | null; receivable: number | null; withDifference: number | null } | null;
  writeoffs: { toReview: number | null; toAuthorize: number | null } | null;
  shortages: { areas: number; pieces: number } | null;
  towels: {
    openLoans: number;
    pending: number;
    depositsByPoint: Array<{ warehouseId: string; name: string; openLoans: number; pending: number; deposits: number }>;
  } | null;
  extras: number | null;
  equipment: { loaned: number; inRepair: number } | null;
  requests: number | null;
  belowMin: number | null;
  purchase: { ordersToApprove: number | null; holdsDue: number | null } | null;
}

// ── Par e inversión ────────────────────────────────────────────────────────

export interface ParReportLine {
  productId: string;
  code: string;
  name: string;
  size: string | null;
  kind: string;
  total: number;
  inTransit: number;
  par: number;
  pct: number | null;
  light: HotelStockLight;
  lastCost: number | null;
  shortfall: number;
  subtotal: number;
  iva16: number;
  total16: number;
  iva8: number;
  total8: number;
}

export interface ParReport {
  lines: ParReportLine[];
  totals: { subtotal: number; iva16: number; total16: number; iva8: number; total8: number; shortfall: number };
  withoutCost: Array<{ productId: string; code: string; name: string; size: string | null; shortfall: number }>;
}

// ── Estado físico ──────────────────────────────────────────────────────────

export type ConditionGrade = "A" | "B" | "C" | "D" | "E";
export const CONDITION_GRADES: readonly ConditionGrade[] = ["A", "B", "C", "D", "E"];

export interface ConditionReportRow {
  product: { id: string; code: string; name: string; size: string | null };
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  total: number;
  pct: Record<ConditionGrade, number | null>;
}

export interface ConditionReport {
  products: ConditionReportRow[];
  totals: { A: number; B: number; C: number; D: number; E: number; total: number; pct: Record<ConditionGrade, number | null> };
}

// ── Merma ──────────────────────────────────────────────────────────────────

export type ShrinkageSource = "TRANSFER" | "COUNT" | "TOWEL" | "WRITEOFF";
export const SHRINKAGE_SOURCES: readonly ShrinkageSource[] = ["TRANSFER", "COUNT", "TOWEL", "WRITEOFF"];

export interface ShrinkageReport {
  from: string;
  to: string;
  bySource: Record<ShrinkageSource, { pieces: number; amount: number }>;
  byReason: Record<string, { pieces: number; amount: number }>;
  total: { pieces: number; amount: number };
  products: Array<{
    productId: string;
    pieces: number;
    amount: number;
    sources: Record<ShrinkageSource, number>;
    product: { id: string; code: string; name: string; size: string | null } | null;
  }>;
}

// ── Lavandería ─────────────────────────────────────────────────────────────

export interface LaundryReport {
  from: string;
  to: string;
  stages: string[];
  lines: Array<{
    product: { id: string; code: string; name: string; size: string | null };
    washed: number;
    lots: number;
    avgCycles: number;
    stages: Record<string, number>;
    quarantine: number;
  }>;
  totals: { washed: number; avgCycles: number; stages: Record<string, number>; quarantine: number };
}

// ── Kardex ─────────────────────────────────────────────────────────────────

export interface KardexReport {
  product: { id: string; code: string; name: string; size: string | null };
  warehouseId: string | null;
  from: string;
  to: string;
  opening: number;
  closing: number;
  entries: Array<{
    date: string;
    folio: string;
    type: string;
    status: string;
    from: { code: string; name: string } | null;
    to: { code: string; name: string } | null;
    lot: { id: string; code: string };
    quantity: number;
    delta: number;
    balance: number;
  }>;
}
