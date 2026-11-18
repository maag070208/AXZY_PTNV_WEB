import type { HotelTransferDetail } from "./types";

// 2ª firma en limpio a área (no bloquea stock): conformidad o diferencia.
export type SignoffStatus = "PENDING" | "CONFORM" | "DIFFERENCE";
export const SIGNOFF_STATUSES: readonly SignoffStatus[] = ["PENDING", "CONFORM", "DIFFERENCE"];
export type SignoffResult = "CONFORM" | "DIFFERENCE";

export interface SignoffRow {
  id: string;
  folio: string;
  from: { id: string; code: string; name: string; kind: string } | null;
  to: { id: string; code: string; name: string; kind: string } | null;
  receivedBy: { id: string; name: string } | null;
  receivedAt: string | null;
  lines: number;
  sentQuantity: number;
  receivedQuantity: number;
  signoffStatus: SignoffStatus;
  signoffBy: { id: string; name: string } | null;
  signoffAt: string | null;
  signoffNotes: string | null;
}

export interface SignoffInput {
  result: SignoffResult;
  notes?: string | null;
}

/** GET /hotel/linen/transfers/:id con los campos de conformidad. */
export interface TransferSignoffDetail extends HotelTransferDetail {
  signoffStatus: SignoffStatus | null;
  signoffBy: { id: string; name: string } | null;
  signoffAt: string | null;
  signoffNotes: string | null;
}
