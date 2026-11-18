import { api } from "@shared/api/client";
import { tableRequest, type ITDataTableFetchParamsPost } from "@shared/api/table";
import type {
  AmenityDeliveryDetail,
  AmenityDeliveryInput,
  AmenityDeliveryRow,
  AmenityRecipient,
  AmenitySuggestion,
} from "../model/amenityDeliveryTypes";

const BASE = "/hotel/linen/amenity-deliveries";

export const amenityDeliveryApi = {
  table: (params: ITDataTableFetchParamsPost) => tableRequest<AmenityDeliveryRow>(`${BASE}/table`, params),
  get: (id: string) => api.get<AmenityDeliveryDetail>(`${BASE}/${id}`),
  create: (input: AmenityDeliveryInput, requestKey: string) =>
    api.post<AmenityDeliveryDetail>(BASE, input, { headers: { "Idempotency-Key": requestKey } }),
  /** Sugerido por área = Σ esperado de las habitaciones de la zona − existencia del área. */
  suggestion: (warehouseId: string) => api.get<AmenitySuggestion>(`${BASE}/suggestion?warehouseId=${encodeURIComponent(warehouseId)}`),
  /** Supervisoras de piso de la zona de la ropería. */
  recipients: (warehouseId: string) => api.get<AmenityRecipient[]>(`${BASE}/recipients?warehouseId=${encodeURIComponent(warehouseId)}`),
  history: (warehouseId: string) => api.get<AmenityDeliveryRow[]>(`${BASE}/history?warehouseId=${encodeURIComponent(warehouseId)}`),
};
