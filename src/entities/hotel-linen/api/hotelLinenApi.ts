import { api } from "@shared/api/client";
import { tableRequest, type ITDataTableFetchParamsPost } from "@shared/api/table";
import type {
  HotelCategory,
  HotelCosignResult,
  HotelLot,
  HotelStockSummaryRow,
  HotelTransferDetail,
  HotelTransferReceiveInput,
  HotelTransferRow,
  HotelTransferSendInput,
  HotelWarehouseLimit,
  HotelLocation,
  HotelProduct,
  HotelProductInput,
  HotelUnit,
  HotelWarehouse,
  HotelWarehouseInput,
  HotelZone,
} from "../model/types";

const withInactive = (path: string, includeInactive?: boolean) =>
  `${path}${includeInactive ? "?includeInactive=true" : ""}`;

export const hotelLinenApi = {
  // productos (blancos, consumibles, equipos)
  products: (includeInactive?: boolean) => api.get<HotelProduct[]>(withInactive("/hotel/products", includeInactive)),
  createProduct: (input: HotelProductInput) => api.post<HotelProduct>("/hotel/products", input),
  updateProduct: (id: string, input: Partial<HotelProductInput>) =>
    api.patch<HotelProduct>(`/hotel/products/${id}`, input),
  removeProduct: (id: string) => api.delete<unknown>(`/hotel/products/${id}`),

  // catálogos de apoyo
  units: (includeInactive?: boolean) => api.get<HotelUnit[]>(withInactive("/hotel/units", includeInactive)),
  createUnit: (input: { name: string; whole?: boolean }) => api.post<HotelUnit>("/hotel/units", input),
  categories: (includeInactive?: boolean) =>
    api.get<HotelCategory[]>(withInactive("/hotel/categories", includeInactive)),
  createCategory: (input: { name: string }) => api.post<HotelCategory>("/hotel/categories", input),
  zones: () => api.get<HotelZone[]>("/hotel/zones"),

  // almacenes / áreas y puntos
  warehouses: (includeInactive?: boolean) =>
    api.get<HotelWarehouse[]>(withInactive("/hotel/warehouses", includeInactive)),
  createWarehouse: (input: HotelWarehouseInput) => api.post<HotelWarehouse>("/hotel/warehouses", input),
  updateWarehouse: (id: string, input: Partial<HotelWarehouseInput>) =>
    api.patch<HotelWarehouse>(`/hotel/warehouses/${id}`, input),
  removeWarehouse: (id: string) => api.delete<unknown>(`/hotel/warehouses/${id}`),
  addLocation: (warehouseId: string, input: { code: string; name?: string | null }) =>
    api.post<HotelLocation>(`/hotel/warehouses/${warehouseId}/locations`, input),

  // F1: traspasos, existencias, lotes, límites y co-firma
  transfersTable: (params: ITDataTableFetchParamsPost) =>
    tableRequest<HotelTransferRow>("/hotel/linen/transfers/table", params),
  transfer: (id: string) => api.get<HotelTransferDetail>(`/hotel/linen/transfers/${id}`),
  sendTransfer: (input: HotelTransferSendInput, requestKey: string) =>
    api.post<HotelTransferDetail>("/hotel/linen/transfers", input, { headers: { "Idempotency-Key": requestKey } }),
  receiveTransfer: (id: string, input: HotelTransferReceiveInput) =>
    api.post<HotelTransferDetail>(`/hotel/linen/transfers/${id}/receive`, input),
  cancelTransfer: (id: string) => api.post<HotelTransferDetail>(`/hotel/linen/transfers/${id}/cancel`, {}),
  stockSummary: (kind?: string) =>
    api.get<HotelStockSummaryRow[]>(`/hotel/linen/stock/summary${kind ? `?kind=${kind}` : ""}`),
  lots: (productId?: string) =>
    api.get<HotelLot[]>(`/hotel/linen/lots${productId ? `?productId=${encodeURIComponent(productId)}` : ""}`),
  warehouseLimits: (warehouseId: string) =>
    api.get<HotelWarehouseLimit[]>(`/hotel/linen/warehouses/${warehouseId}/limits`),
  setWarehouseLimits: (warehouseId: string, limits: Array<{ productId: string; minStock: number; maxStock: number }>) =>
    api.put<HotelWarehouseLimit[]>(`/hotel/linen/warehouses/${warehouseId}/limits`, { limits }),
  cosign: (input: { username: string; password: string }) =>
    api.post<HotelCosignResult>("/hotel/linen/signatures/cosign", input),
};
