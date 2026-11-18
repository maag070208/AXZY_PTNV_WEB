import type { HotelTransferDetail, HotelTransferStatus } from "./types";

// Entrega de amenidades: traspaso Almacén -> ropería con destinataria supervisora (folio EA-0001).
export interface AmenityDeliveryRow {
  id: string;
  folio: string;
  date: string;
  status: HotelTransferStatus;
  from: { id: string; code: string; name: string; kind: string } | null;
  to: { id: string; code: string; name: string; kind: string } | null;
  sentBy: { id: string; name: string } | null;
  recipient: { id: string; name: string } | null;
  receivedBy: { id: string; name: string } | null;
  receivedAt: string | null;
  lines: number;
  sentQuantity: number;
  receivedQuantity: number | null;
  difference: number | null;
}

export interface AmenityDeliveryInput {
  fromWarehouseId: string;
  toWarehouseId: string;
  recipientId: string;
  lines: Array<{ productId: string; quantity: number }>;
  notes?: string | null;
}

export interface AmenitySuggestionLine {
  product: { id: string; code: string; name: string };
  expected: number;
  onHand: number;
  suggested: number;
}

export interface AmenitySuggestion {
  warehouseId: string;
  zoneId: string;
  rooms: number;
  lines: AmenitySuggestionLine[];
}

export interface AmenityRecipient {
  id: string;
  name: string;
}

export type AmenityDeliveryDetail = HotelTransferDetail & { recipient: AmenityRecipient | null };
