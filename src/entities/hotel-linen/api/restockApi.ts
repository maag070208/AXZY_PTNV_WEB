import { api } from "@shared/api/client";
import type { RestockResult } from "../model/restockTypes";

const BASE = "/hotel/linen";

export const restockApi = {
  compute: (warehouseId: string, factor: number) =>
    api.get<RestockResult>(`${BASE}/restock?warehouseId=${encodeURIComponent(warehouseId)}&factor=${factor}`),
  /** Crea el pedido de área (borrador) con el déficit; 409 `HOTEL_RESTOCK_NO_DEFICIT` si no hay. */
  request: (warehouseId: string, factor: number) => api.post<{ id: string; folio: string }>(`${BASE}/restock/request`, { warehouseId, factor }),
};
