import { api } from "@shared/api/client";
import { tableRequest, type ITDataTableFetchParamsPost } from "@shared/api/table";
import type {
  PurchaseGenerateResult,
  PurchaseHoldRow,
  PurchaseLookups,
  PurchaseOrderDetail,
  PurchaseOrderInput,
  PurchaseOrderRow,
  PurchaseReceiptInput,
  PurchaseRequestRow,
} from "../model/purchaseTypes";

const BASE = "/hotel/linen/purchases";
const key = (requestKey: string) => ({ headers: { "Idempotency-Key": requestKey } });

export const purchaseApi = {
  lookups: () => api.get<PurchaseLookups>(`${BASE}/lookups`),
  ordersTable: (params: ITDataTableFetchParamsPost) => tableRequest<PurchaseOrderRow>(`${BASE}/table`, params),
  order: (id: string) => api.get<PurchaseOrderDetail>(`${BASE}/${id}`),
  createOrder: (input: PurchaseOrderInput) => api.post<PurchaseOrderDetail>(BASE, input),
  updateOrder: (id: string, input: Partial<PurchaseOrderInput>) => api.patch<PurchaseOrderDetail>(`${BASE}/${id}`, input),
  approveOrder: (id: string) => api.post<PurchaseOrderDetail>(`${BASE}/${id}/approve`, {}),
  cancelOrder: (id: string) => api.post<PurchaseOrderDetail>(`${BASE}/${id}/cancel`, {}),
  closeOrder: (id: string, notes: string) => api.post<PurchaseOrderDetail>(`${BASE}/${id}/close`, { notes }),
  receive: (id: string, input: PurchaseReceiptInput, requestKey: string) =>
    api.post<PurchaseOrderDetail>(`${BASE}/${id}/receipts`, input, key(requestKey)),

  holdsTable: (params: ITDataTableFetchParamsPost) => tableRequest<PurchaseHoldRow>(`${BASE}/holds/table`, params),
  resolveHold: (id: string, action: "ACCEPT" | "RETURN", notes?: string | null) =>
    api.post<PurchaseHoldRow>(`${BASE}/holds/${id}/resolve`, { action, notes }),

  requestsTable: (params: ITDataTableFetchParamsPost) => tableRequest<PurchaseRequestRow>(`${BASE}/requests/table`, params),
  generateWeekly: (weekFrom: string) => api.post<PurchaseGenerateResult>(`${BASE}/requests/generate-weekly`, { weekFrom }),
  generateLowStock: () => api.post<PurchaseGenerateResult>(`${BASE}/requests/generate-low-stock`, {}),
  convertRequest: (id: string, supplierId: string, warehouseId?: string | null) =>
    api.post<{ orderId: string; request: PurchaseRequestRow }>(`${BASE}/requests/${id}/convert`, { supplierId, warehouseId }),
  dismissRequest: (id: string) => api.post<PurchaseRequestRow>(`${BASE}/requests/${id}/dismiss`, {}),
};
