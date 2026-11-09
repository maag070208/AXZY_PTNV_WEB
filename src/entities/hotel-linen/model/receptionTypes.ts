// Tipos de Recepción de Blancos (F4): préstamo de toallas, corte de turno, adicionales y equipos.
import type { HotelSignatureEntry, HotelUserRef, HotelWarehouseRef } from "./types";

export type DepositMethod = "CASH" | "CARD" | "ROOM_CHARGE";
export const DEPOSIT_METHODS: readonly DepositMethod[] = ["CASH", "CARD", "ROOM_CHARGE"];
export type TowelLoanStatus = "OPEN" | "PARTIAL" | "RETURNED" | "UNRETURNED";
export const TOWEL_LOAN_STATUSES: readonly TowelLoanStatus[] = ["OPEN", "PARTIAL", "RETURNED", "UNRETURNED"];

export interface ReceptionProductRef {
  id: string;
  code: string;
  name: string;
  size?: string | null;
}

export interface TowelLoan {
  id: string;
  folio: string;
  point: HotelWarehouseRef;
  product: ReceptionProductRef;
  quantity: number;
  returnedQty: number;
  pendingQty: number;
  guestName: string;
  room: string | null;
  visitorId: string | null;
  depositUnit: number;
  depositMethod: DepositMethod;
  depositCollected: number;
  depositReturned: number;
  depositHeld: number;
  depositRetained: number;
  status: TowelLoanStatus;
  lentBy: HotelUserRef;
  lentAt: string;
  returnedBy: HotelUserRef | null;
  returnedAt: string | null;
  shiftCloseId: string | null;
  notes: string | null;
  /** Solo en la respuesta de devolver. */
  depositRefund?: number;
}

export interface TowelLoanInput {
  warehouseId: string;
  productId: string;
  quantity: number;
  guestName: string;
  room?: string | null;
  visitorId?: string | null;
  depositMethod: DepositMethod;
  notes?: string | null;
}

export interface PointSummary {
  warehouse: HotelWarehouseRef | null;
  depositUnit: number;
  openLoans: number;
  lentPending: number;
  deposits: Record<DepositMethod, number>;
  depositsTotal: number;
  lastCloseAt: string | null;
}

export interface ShiftCloseTotals {
  lent: number;
  returned: number;
  unreturned: number;
  depositsCollected: number;
  depositsReturned: number;
  depositsRetained: number;
}

export interface ShiftClosePreview {
  totals: ShiftCloseTotals;
  included: number;
  carriedOver: number;
}

export interface ShiftCloseRow extends ShiftCloseTotals {
  id: string;
  folio: string;
  point: HotelWarehouseRef;
  closedBy: HotelUserRef;
  receivedBy: HotelUserRef | null;
  endOfDay: boolean;
  from: string;
  to: string;
  reviewedBy: HotelUserRef | null;
  reviewedAt: string | null;
  notes: string | null;
  carriedOver?: number;
}

export interface ShiftCloseDetail extends ShiftCloseRow {
  loans: Array<{
    id: string;
    folio: string;
    product: ReceptionProductRef;
    guestName: string;
    room: string | null;
    quantity: number;
    returnedQty: number;
    depositUnit: number;
    depositMethod: DepositMethod;
    status: TowelLoanStatus;
  }>;
  signatures: HotelSignatureEntry[];
}

export interface ShiftCloseInput {
  warehouseId: string;
  cosignToken?: string | null;
  endOfDay?: boolean;
  markUnreturned: string[];
  notes?: string | null;
}

// ── Adicionales ────────────────────────────────────────────────────────────

export type ExtraStatus = "REQUESTED" | "DELIVERED" | "COLLECTED" | "MISSING" | "CANCELLED";
export const EXTRA_STATUSES: readonly ExtraStatus[] = ["REQUESTED", "DELIVERED", "COLLECTED", "MISSING", "CANCELLED"];
export type ExtraKind = "LINEN" | "CONSUMABLE";

export interface RoomExtra {
  id: string;
  room: { id: string; number: string; status: string; zoneId: string; zone: { id: string; name: string } };
  product: ReceptionProductRef;
  quantity: number;
  kind: ExtraKind;
  sourceWarehouse: { id: string; code: string; name: string };
  notes: string | null;
  status: ExtraStatus;
  requestedBy: HotelUserRef;
  requestedAt: string;
  deliveredBy: HotelUserRef | null;
  deliveredAt: string | null;
  collectedBy: HotelUserRef | null;
  collectedAt: string | null;
  collectedQty: number | null;
  missingQty: number;
}

export interface RoomExtraInput {
  roomId: string;
  productId: string;
  quantity: number;
  warehouseId?: string | null;
  notes?: string | null;
}

export interface ExtrasBoard {
  zones: Array<{
    zone: { id: string; name: string };
    rooms: Array<{ room: { id: string; number: string; status: string }; collectNow: boolean; extras: RoomExtra[] }>;
  }>;
}

export interface HotelRoomOption {
  id: string;
  number: string;
  status?: string;
  zone?: { id: string; name: string } | null;
}

// ── Equipos ────────────────────────────────────────────────────────────────

export type EquipmentStatus = "AVAILABLE" | "LOANED" | "IN_REPAIR" | "MISSING" | "RETIRED";
export const EQUIPMENT_STATUSES: readonly EquipmentStatus[] = ["AVAILABLE", "LOANED", "IN_REPAIR", "MISSING", "RETIRED"];
export type EquipmentCondition = "GOOD" | "DAMAGED" | "MISSING";

export interface EquipmentUnit {
  id: string;
  tag: string;
  status: EquipmentStatus;
  notes: string | null;
  product: { id: string; code: string; name: string; tagPrefix: string | null };
  warehouse: { id: string; code: string; name: string };
  createdAt: string;
}

export interface EquipmentLoan {
  id: string;
  unit: { id: string; tag: string; status: EquipmentStatus; product: { id: string; code: string; name: string } };
  room: { id: string; number: string; status: string; zone: { id: string; name: string } };
  requestedBy: HotelUserRef;
  requestedAt: string;
  deliveredBy: HotelUserRef | null;
  deliveredAt: string | null;
  returnedAt: string | null;
  returnedBy: HotelUserRef | null;
  condition: EquipmentCondition | null;
  chargeAmount: number | null;
  ticketId: string | null;
  notes: string | null;
}

export interface EquipmentBoard {
  loans: EquipmentLoan[];
  summary: Record<EquipmentStatus, number>;
}

export interface EquipmentReturnInput {
  condition: EquipmentCondition;
  chargeAmount?: number | null;
  notes?: string | null;
}
