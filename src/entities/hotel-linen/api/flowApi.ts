import { api } from "@shared/api/client";
import type { FlowBoard } from "../model/flowTypes";

export const flowApi = {
  board: (kind = "LINEN") => api.get<FlowBoard>(`/hotel/linen/flow?kind=${encodeURIComponent(kind)}`),
};
