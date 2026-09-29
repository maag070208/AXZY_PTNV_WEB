import { api } from "@shared/api/client";
import { tableRequest, type ITDataTableFetchParamsPost } from "@shared/api/table";
import type {
  FefoPreview,
  FefoPreviewInput,
  KitchenAdjustmentInput,
  KitchenAlerts,
  KitchenCategory,
  KitchenItemDetail,
  KitchenItemInput,
  KitchenItemRow,
  KitchenLotRow,
  KitchenMovement,
  KitchenStockInInput,
  KitchenStockOutInput,
  KitchenUnit,
  KitchenUnitInput,
  PurchaseOrderDetail,
  PurchaseOrderInput,
  PurchaseOrderReceiveInput,
  PurchaseOrderRow,
  RestockRow,
  Supplier,
} from "../model/types";

/** Cabecera de idempotencia (misma petición repetida no se duplica). */
const withKey = (key: string) => ({ headers: { "Idempotency-Key": key } });

export const kitchenApi = {
  // catálogos propios
  categories: (includeInactive?: boolean) =>
    api.get<KitchenCategory[]>(
      `/kitchen/categories${includeInactive ? "?includeInactive=true" : ""}`
    ),
  createCategory: (input: { name: string }) => api.post<KitchenCategory>("/kitchen/categories", input),
  updateCategory: (id: string, input: { name?: string; active?: boolean }) =>
    api.patch<KitchenCategory>(`/kitchen/categories/${id}`, input),

  suppliers: (includeInactive?: boolean) =>
    api.get<Supplier[]>(`/kitchen/suppliers${includeInactive ? "?includeInactive=true" : ""}`),
  createSupplier: (input: Omit<Supplier, "id" | "active">) =>
    api.post<Supplier>("/kitchen/suppliers", input),
  updateSupplier: (id: string, input: Partial<Omit<Supplier, "id">>) =>
    api.patch<Supplier>(`/kitchen/suppliers/${id}`, input),

  units: (includeInactive?: boolean) =>
    api.get<KitchenUnit[]>(`/kitchen/units${includeInactive ? "?includeInactive=true" : ""}`),
  createUnit: (input: KitchenUnitInput) => api.post<KitchenUnit>("/kitchen/units", input),
  updateUnit: (id: string, input: Partial<KitchenUnitInput>) =>
    api.patch<KitchenUnit>(`/kitchen/units/${id}`, input),

  // artículos
  itemsTable: (params: ITDataTableFetchParamsPost) =>
    tableRequest<KitchenItemRow>("/kitchen/items/table", params),
  item: (id: string) => api.get<KitchenItemDetail>(`/kitchen/items/${id}`),
  createItem: (input: KitchenItemInput) => api.post<KitchenItemDetail>("/kitchen/items", input),
  updateItem: (id: string, input: Partial<KitchenItemInput>) =>
    api.patch<KitchenItemDetail>(`/kitchen/items/${id}`, input),

  // lotes y movimientos
  lotsTable: (params: ITDataTableFetchParamsPost) =>
    tableRequest<KitchenLotRow>("/kitchen/lots/table", params),
  movementsTable: (params: ITDataTableFetchParamsPost) =>
    tableRequest<KitchenMovement>("/kitchen/movements/table", params),
  movement: (id: string) => api.get<KitchenMovement>(`/kitchen/movements/${id}`),

  stockIn: (input: KitchenStockInInput, key: string) =>
    api.post<KitchenMovement>("/kitchen/movements/stock-in", input, withKey(key)),
  stockOut: (input: KitchenStockOutInput, key: string) =>
    api.post<KitchenMovement>("/kitchen/movements/stock-out", input, withKey(key)),
  adjust: (input: KitchenAdjustmentInput, key: string) =>
    api.post<KitchenMovement>("/kitchen/movements/adjustments", input, withKey(key)),
  fefoPreview: (input: FefoPreviewInput) =>
    api.post<FefoPreview>("/kitchen/movements/fefo-preview", input),
  reverse: (id: string, notes: string | null, key: string) =>
    api.post<KitchenMovement>(`/kitchen/movements/${id}/reverse`, { notes }, withKey(key)),

  // reabastecimiento y alertas
  restock: () => api.get<RestockRow[]>("/kitchen/restock"),
  alerts: () => api.get<KitchenAlerts>("/kitchen/alerts"),

  // órdenes de compra (F3)
  purchaseOrdersTable: (params: ITDataTableFetchParamsPost) =>
    tableRequest<PurchaseOrderRow>("/kitchen/purchase-orders/table", params),
  purchaseOrder: (id: string) => api.get<PurchaseOrderDetail>(`/kitchen/purchase-orders/${id}`),
  createPurchaseOrder: (input: PurchaseOrderInput) =>
    api.post<PurchaseOrderDetail>("/kitchen/purchase-orders", input),
  updatePurchaseOrder: (id: string, input: Partial<PurchaseOrderInput>) =>
    api.patch<PurchaseOrderDetail>(`/kitchen/purchase-orders/${id}`, input),
  approvePurchaseOrder: (id: string) =>
    api.post<PurchaseOrderDetail>(`/kitchen/purchase-orders/${id}/approve`, {}),
  sendPurchaseOrder: (id: string) =>
    api.post<PurchaseOrderDetail>(`/kitchen/purchase-orders/${id}/send`, {}),
  cancelPurchaseOrder: (id: string, notes: string | null) =>
    api.post<PurchaseOrderDetail>(`/kitchen/purchase-orders/${id}/cancel`, { notes }),
  receivePurchaseOrder: (id: string, input: PurchaseOrderReceiveInput, key: string) =>
    api.post<KitchenMovement>(`/kitchen/purchase-orders/${id}/receive`, input, withKey(key)),
};
