import type { HotelUserRef, HotelWarehouseRef } from "./types";
import type { LaundryProductRef, SupplyRequestDetail, SupplyRequestStatus } from "./laundryTypes";

// Pedido de blancos por habitación (tablet).

export interface TurnoverSuggestion {
  room: { id: string; number: string };
  area: HotelWarehouseRef;
  lines: Array<{ product: LaundryProductRef; quantity: number }>;
  openRequest: { id: string; folio: string; status: SupplyRequestStatus } | null;
}

export interface TurnoverInput {
  roomId: string;
  /** Lista final (ajustada por la supervisora). Sin ella el API usa el sugerido. */
  lines?: Array<{ productId: string; requestedQty: number }>;
  notes?: string | null;
}

export interface TurnoverResult {
  created: boolean;
  request: SupplyRequestDetail;
}

export interface QueueLine {
  id: string;
  product: Pick<LaundryProductRef, "id" | "code" | "name">;
  requestedQty: number;
  deliveredQty: number;
  receivedQty: number;
  dirtyCollectedQty: number | null;
  pendingQty: number;
}

export interface QueueItem {
  id: string;
  folio: string;
  status: SupplyRequestStatus;
  origin: "MANUAL" | "ROOM_TURNOVER";
  room: { id: string; number: string } | null;
  area: HotelWarehouseRef;
  requestedBy: HotelUserRef | null;
  carrier: HotelUserRef | null;
  createdAt: string;
  readyAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  ageMinutes: number;
  lines: QueueLine[];
}

/** Cola por rol: cada sección llega solo si el usuario tiene el permiso (si no, vacía). */
export interface TurnoverQueue {
  toFulfill: QueueItem[];
  requested: QueueItem[];
  toPickUp: QueueItem[];
  carrying: QueueItem[];
  /** Pedidos cerrados (RECEIVED) en las últimas 12 h, para reportar diferencia. */
  delivered: QueueItem[];
}
