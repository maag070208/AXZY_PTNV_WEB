// Tipos de bajas de blancos y conteo físico A–E (F3).
import type { HotelSignatureEntry, HotelUserRef, HotelWarehouseRef } from "./types";

export type WriteoffReasonCode = "R" | "M" | "D" | "Q" | "F";
/** Orden de las columnas del formato semanal. */
export const WRITEOFF_REASONS: readonly WriteoffReasonCode[] = ["R", "M", "D", "Q", "F"];

export type WriteoffStatus = "PENDING_APPROVAL" | "ACTIVE" | "CANCELLED";
export const WRITEOFF_STATUSES: readonly WriteoffStatus[] = ["PENDING_APPROVAL", "ACTIVE", "CANCELLED"];

export type WriteoffDisposition = "SECOND_LIFE" | "DISPOSAL";
export const WRITEOFF_DISPOSITIONS: readonly WriteoffDisposition[] = ["SECOND_LIFE", "DISPOSAL"];

/** Etapa de la bandeja: por revisar (Gerente Ops) o por autorizar (Supervisora general). */
export type WriteoffStage = "review" | "authorize";

export interface WriteoffRow {
  id: string;
  folio: string;
  date: string;
  status: WriteoffStatus;
  warehouse: HotelWarehouseRef | null;
  /** Almacén del área que solicitó (aunque la pieza esté retenida en cuarentena). */
  originWarehouse: HotelWarehouseRef | null;
  /** Baja física esperando autorización con la pieza retenida en cuarentena. */
  quarantined: boolean;
  reason: { code: string | null; name: string } | null;
  requestedBy: HotelUserRef;
  reviewed: boolean;
  disposition: WriteoffDisposition | null;
  lines: number;
  quantity: number;
  cost: number;
  photos: number;
}

export interface WriteoffLine {
  id: string;
  product: { id: string; code: string; name: string; size: string | null };
  lot: { id: string; code: string } | null;
  location: { id: string; code: string } | null;
  quantity: number;
  unitCost: number | null;
}

export interface WriteoffEvidence {
  id: string;
  mime: string;
  size: number;
  url: string | null;
  createdAt: string;
}

export interface WriteoffSignature extends HotelSignatureEntry {
  notes: string | null;
}

export interface WriteoffDetail {
  id: string;
  folio: string;
  date: string;
  status: WriteoffStatus;
  warehouse: HotelWarehouseRef | null;
  warehouseId: string | null;
  originWarehouse: HotelWarehouseRef | null;
  /** La pieza está retenida en la cuarentena de Lavandería. */
  quarantined: boolean;
  reason: { code: string | null; name: string } | null;
  notes: string | null;
  requestedBy: HotelUserRef;
  approvedBy: HotelUserRef | null;
  approvedAt: string | null;
  disposition: WriteoffDisposition | null;
  stocktakeId: string | null;
  lines: WriteoffLine[];
  cost: number;
  evidence: WriteoffEvidence[];
  signatures: WriteoffSignature[];
  reviewed: boolean;
  /** Autorizada sin revisión previa del Gerente Ops. */
  reviewSkipped: boolean;
}

export interface WriteoffLineInput {
  productId: string;
  lotId?: string | null;
  quantity: number;
  reasonCode: WriteoffReasonCode;
}

export interface WriteoffCreateInput {
  warehouseId: string;
  locationId?: string | null;
  lines: WriteoffLineInput[];
  notes?: string | null;
  photos: File[];
}

export interface WeeklyWriteoffRow {
  productId: string;
  code: string;
  name: string;
  size: string | null;
  byReason: Record<WriteoffReasonCode, number>;
  total: number;
  cost: number;
}

export interface WeeklyWriteoffReport {
  from: string;
  to: string;
  writeoffs: number;
  rows: WeeklyWriteoffRow[];
  totals: { byReason: Record<WriteoffReasonCode, number>; total: number; cost: number };
}

// ── Conteo físico ──────────────────────────────────────────────────────────

export type StocktakeStatus = "DRAFT" | "COUNTING" | "PENDING_APPROVAL" | "APPLIED" | "CANCELLED";

export interface StocktakeSummary {
  id: string;
  folio: string;
  warehouseId: string;
  status: StocktakeStatus;
  blind: boolean;
  notes: string | null;
  createdAt: string;
  closedAt: string | null;
  approvedAt: string | null;
}

export interface StocktakeLine {
  id: string;
  productId: string;
  locationId: string;
  systemQty?: number | string | null;
  countedQty: number | string | null;
  gradeA: number | string | null;
  gradeB: number | string | null;
  gradeC: number | string | null;
  gradeD: number | string | null;
  gradeE: number | string | null;
  product: { id: string; code: string; name: string; kind?: string };
  location: { id: string; code: string };
}

export interface StocktakeDetail extends StocktakeSummary {
  lines: StocktakeLine[];
}

export const GRADES = ["A", "B", "C", "D", "E"] as const;
export type Grade = (typeof GRADES)[number];

export interface StocktakeCaptureLine {
  productId: string;
  locationId: string;
  /** Cantidades para amenidades (sin grados A–E). */
  countedQty?: number;
  gradeA?: number;
  gradeB?: number;
  gradeC?: number;
  gradeD?: number;
  gradeE?: number;
}
