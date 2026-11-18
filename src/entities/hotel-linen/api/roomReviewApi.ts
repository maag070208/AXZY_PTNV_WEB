import { api } from "@shared/api/client";
import { tableRequest, type ITDataTableFetchParamsPost } from "@shared/api/table";
import type { RoomExpected, RoomReview, RoomReviewConsolidated, RoomReviewInput } from "../model/roomReviewTypes";

const BASE = "/hotel/linen";

export const roomReviewApi = {
  table: (params: ITDataTableFetchParamsPost) => tableRequest<RoomReview>(`${BASE}/room-reviews/table`, params),
  get: (id: string) => api.get<RoomReview>(`${BASE}/room-reviews/${id}`),
  create: (input: RoomReviewInput) => api.post<RoomReview>(`${BASE}/room-reviews`, input),
  history: (roomId: string) => api.get<RoomReview[]>(`${BASE}/rooms/${roomId}/reviews`),
  /** Esperado de la habitación; 409 `HOTEL_ROOM_PAR_EMPTY` si no hay dotación de blancos. */
  expected: (roomId: string) => api.get<RoomExpected>(`${BASE}/rooms/${roomId}/expected`),
  consolidated: (from: string, to: string, zoneId?: string) =>
    api.get<RoomReviewConsolidated>(
      `${BASE}/room-reviews/consolidated?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${zoneId ? `&zoneId=${encodeURIComponent(zoneId)}` : ""}`
    ),
};
