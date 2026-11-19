import { api } from "@shared/api/client";
import type { SupplyRequestDetail } from "../model/laundryTypes";
import type { TurnoverInput, TurnoverQueue, TurnoverResult, TurnoverSuggestion } from "../model/turnoverTypes";

const BASE = "/hotel/linen";

export const turnoverApi = {
  suggestion: (roomId: string) => api.get<TurnoverSuggestion>(`${BASE}/rooms/${roomId}/turnover-suggestion`),
  /** "Se desocupó": crea y envía el pedido; si la habitación ya tiene uno abierto lo devuelve (`created: false`). */
  create: (input: TurnoverInput) => api.post<TurnoverResult>(`${BASE}/supply-requests/room-turnover`, input),
  queue: () => api.get<TurnoverQueue>(`${BASE}/supply-requests/queue`),
  pickup: (id: string) => api.post<SupplyRequestDetail>(`${BASE}/supply-requests/${id}/pickup`, {}),
  /** Recoger varias habitaciones en un viaje: `conflicts` = las que otra auxiliar ya tomó o ya no están listas. */
  pickupMany: (ids: string[]) => api.post<{ picked: string[]; conflicts: string[] }>(`${BASE}/supply-requests/pickup`, { ids }),
  /** Entregar; `dirtyLines` = sucio recogido (por omisión, lo entregado). El pedido queda cerrado (RECEIVED). */
  deliver: (id: string, dirtyLines?: Array<{ productId: string; quantity: number }>) =>
    api.post<SupplyRequestDetail>(`${BASE}/supply-requests/${id}/deliver`, dirtyLines ? { dirtyLines } : {}),
  /** Extras de la supervisora mientras el pedido está por surtir (SUBMITTED). */
  addLines: (id: string, lines: Array<{ productId: string; quantity: number }>) =>
    api.post<SupplyRequestDetail>(`${BASE}/supply-requests/${id}/lines`, { lines }),
  /** Diferencia sobre un pedido entregado: genera un ajuste de salida. */
  reportDifference: (id: string, input: { lines: Array<{ productId: string; missingQty: number }>; notes: string }) =>
    api.post<{ request: SupplyRequestDetail; adjustment: { id: string; folio: string; status: string } }>(`${BASE}/supply-requests/${id}/difference`, input),
};
