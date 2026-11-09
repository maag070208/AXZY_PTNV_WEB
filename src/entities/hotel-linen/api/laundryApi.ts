import { api } from "@shared/api/client";
import { tableRequest, type ITDataTableFetchParamsPost } from "@shared/api/table";
import type {
  DailyReconciliation,
  DirtyReceiptDetail,
  DirtyReceiptInput,
  DirtyReceiptPrefill,
  DirtyReceiptRow,
  FirstWashInput,
  LaundryBoard,
  LaundryMove,
  SupplierReturnInput,
  SupplyFulfillInput,
  SupplyRequestDetail,
  SupplyRequestInput,
  SupplyRequestRow,
  SupplySuggestion,
} from "../model/laundryTypes";
import type { HotelTransferDetail } from "../model/types";

const BASE = "/hotel/linen";
const key = (requestKey: string) => ({ headers: { "Idempotency-Key": requestKey } });

export const laundryApi = {
  board: () => api.get<LaundryBoard>(`${BASE}/laundry/board`),
  process: (moves: LaundryMove[], notes?: string | null) => api.post<unknown>(`${BASE}/laundry/process`, { moves, notes }),
  firstWash: (input: FirstWashInput, requestKey: string) =>
    api.post<HotelTransferDetail>(`${BASE}/first-wash`, input, key(requestKey)),
  supplierReturn: (input: SupplierReturnInput, requestKey: string) =>
    api.post<HotelTransferDetail>(`${BASE}/supplier-returns`, input, key(requestKey)),

  suggestion: (warehouseId: string, checkouts: number, occupied: number) =>
    api.get<SupplySuggestion>(
      `${BASE}/supply-requests/suggestion?warehouseId=${encodeURIComponent(warehouseId)}&checkouts=${checkouts}&occupied=${occupied}`
    ),
  requestsTable: (params: ITDataTableFetchParamsPost) =>
    tableRequest<SupplyRequestRow>(`${BASE}/supply-requests/table`, params),
  request: (id: string) => api.get<SupplyRequestDetail>(`${BASE}/supply-requests/${id}`),
  createRequest: (input: SupplyRequestInput) => api.post<SupplyRequestDetail>(`${BASE}/supply-requests`, input),
  submitRequest: (id: string) => api.post<SupplyRequestDetail>(`${BASE}/supply-requests/${id}/submit`, {}),
  cancelRequest: (id: string) => api.post<SupplyRequestDetail>(`${BASE}/supply-requests/${id}/cancel`, {}),
  fulfillRequest: (id: string, input: SupplyFulfillInput) =>
    api.post<SupplyRequestDetail>(`${BASE}/supply-requests/${id}/fulfill`, input),
  confirmRequest: (id: string) => api.post<SupplyRequestDetail>(`${BASE}/supply-requests/${id}/confirm`, {}),

  dirtyPrefill: (warehouseId: string, date?: string) =>
    api.get<DirtyReceiptPrefill>(
      `${BASE}/dirty-receipts/prefill?warehouseId=${encodeURIComponent(warehouseId)}${date ? `&date=${date}` : ""}`
    ),
  dirtyTable: (params: ITDataTableFetchParamsPost) =>
    tableRequest<DirtyReceiptRow>(`${BASE}/dirty-receipts/table`, params),
  dirtyReceipt: (id: string) => api.get<DirtyReceiptDetail>(`${BASE}/dirty-receipts/${id}`),
  createDirtyReceipt: (input: DirtyReceiptInput) => api.post<DirtyReceiptDetail>(`${BASE}/dirty-receipts`, input),

  reconciliation: (date?: string) =>
    api.get<DailyReconciliation>(`${BASE}/reconciliation/daily${date ? `?date=${date}` : ""}`),
};
