import { api } from "@shared/api/client";
import { tableRequest, type ITDataTableFetchParamsPost } from "@shared/api/table";
import type { GuestLossCharge, GuestLossFromExtraInput, WriteoffDetail } from "../model/writeoffTypes";
import type {
  EquipmentBoard,
  EquipmentLoan,
  EquipmentReturnInput,
  EquipmentStatus,
  EquipmentUnit,
  ExtrasBoard,
  HotelRoomOption,
  PointSummary,
  RoomExtra,
  RoomExtraInput,
  ShiftCloseDetail,
  ShiftCloseInput,
  ShiftClosePreview,
  ShiftCloseRow,
  TowelLoan,
  TowelLoanInput,
} from "../model/receptionTypes";

const BASE = "/hotel/linen";

export const receptionApi = {
  // préstamos de toallas y cortes de turno
  loansTable: (params: ITDataTableFetchParamsPost) => tableRequest<TowelLoan>(`${BASE}/loans/table`, params),
  createLoan: (input: TowelLoanInput) => api.post<TowelLoan>(`${BASE}/loans`, input),
  returnLoan: (folio: string, quantity: number) => api.post<TowelLoan>(`${BASE}/loans/${folio}/return`, { quantity }),
  /** Convierte un préstamo UNRETURNED en pérdida por huésped (sin recapturar datos). */
  loanGuestLoss: (folio: string, input: GuestLossCharge) => api.post<WriteoffDetail>(`${BASE}/loans/${folio}/guest-loss`, input),
  pointSummary: (warehouseId: string) =>
    api.get<PointSummary>(`${BASE}/loans/point-summary?warehouseId=${encodeURIComponent(warehouseId)}`),
  closePreview: (warehouseId: string, marked: string[]) =>
    api.get<ShiftClosePreview>(
      `${BASE}/shift-closes/preview?warehouseId=${encodeURIComponent(warehouseId)}&mark=${marked.join(",")}`
    ),
  createClose: (input: ShiftCloseInput) => api.post<ShiftCloseRow>(`${BASE}/shift-closes`, input),
  closesTable: (params: ITDataTableFetchParamsPost) => tableRequest<ShiftCloseRow>(`${BASE}/shift-closes/table`, params),
  close: (id: string) => api.get<ShiftCloseDetail>(`${BASE}/shift-closes/${id}`),
  reviewClose: (id: string) => api.post<ShiftCloseDetail>(`${BASE}/shift-closes/${id}/review`, {}),

  // adicionales a habitación
  rooms: () => api.get<HotelRoomOption[]>("/hotel/rooms"),
  extrasBoard: () => api.get<ExtrasBoard>(`${BASE}/extras/board`),
  extrasTable: (params: ITDataTableFetchParamsPost) => tableRequest<RoomExtra>(`${BASE}/extras/table`, params),
  createExtra: (input: RoomExtraInput) => api.post<RoomExtra>(`${BASE}/extras`, input),
  deliverExtra: (id: string, cosignToken?: string | null) =>
    api.post<RoomExtra>(`${BASE}/extras/${id}/deliver`, { cosignToken: cosignToken ?? null }),
  collectExtra: (id: string, collectedQty: number) => api.post<RoomExtra>(`${BASE}/extras/${id}/collect`, { collectedQty }),
  /** Convierte un adicional MISSING en pérdida por huésped. */
  extraGuestLoss: (id: string, input: GuestLossFromExtraInput) => api.post<WriteoffDetail>(`${BASE}/extras/${id}/guest-loss`, input),
  cancelExtra: (id: string) => api.post<RoomExtra>(`${BASE}/extras/${id}/cancel`, {}),

  // equipos por pieza
  units: (status?: EquipmentStatus) => api.get<EquipmentUnit[]>(`${BASE}/equipment/units${status ? `?status=${status}` : ""}`),
  unitsTable: (params: ITDataTableFetchParamsPost) => tableRequest<EquipmentUnit>(`${BASE}/equipment/units/table`, params),
  createUnits: (input: { productId: string; quantity: number; notes?: string | null }) =>
    api.post<EquipmentUnit[]>(`${BASE}/equipment/units`, input),
  patchUnit: (id: string, input: { status?: "AVAILABLE" | "RETIRED"; notes?: string | null }) =>
    api.patch<EquipmentUnit>(`${BASE}/equipment/units/${id}`, input),
  repaired: (id: string) => api.post<EquipmentUnit>(`${BASE}/equipment/units/${id}/repaired`, {}),
  equipmentBoard: () => api.get<EquipmentBoard>(`${BASE}/equipment/board`),
  lendEquipment: (input: { unitId: string; roomId: string; notes?: string | null }) =>
    api.post<EquipmentLoan>(`${BASE}/equipment/loans`, input),
  deliverEquipment: (id: string, cosignToken?: string | null) =>
    api.post<EquipmentLoan>(`${BASE}/equipment/loans/${id}/deliver`, { cosignToken: cosignToken ?? null }),
  returnEquipment: (id: string, input: EquipmentReturnInput) =>
    api.post<EquipmentLoan>(`${BASE}/equipment/loans/${id}/return`, input),
};
