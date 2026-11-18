import { api } from "@shared/api/client";
import type { RoomParKind, RoomParMatrix, RoomParSaveInput } from "../model/roomParTypes";

const BASE = "/hotel/linen/room-pars";

export const roomParApi = {
  list: (kind: RoomParKind) => api.get<RoomParMatrix>(`${BASE}?kind=${kind}`),
  save: (input: RoomParSaveInput) => api.put<{ kind: RoomParKind; lines: number }>(BASE, input),
};
