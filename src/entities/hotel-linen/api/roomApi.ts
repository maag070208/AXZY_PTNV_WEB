import { api } from "@shared/api/client";
import type { HotelRoom, HotelRoomCreateInput, HotelRoomTypeOption, HotelRoomUpdateInput } from "../model/roomTypes";

export const roomApi = {
  list: (includeInactive = true) => api.get<HotelRoom[]>(`/hotel/rooms?includeInactive=${includeInactive}`),
  types: () => api.get<HotelRoomTypeOption[]>("/hotel/room-types"),
  create: (input: HotelRoomCreateInput) => api.post<HotelRoom>("/hotel/rooms", input),
  update: (id: string, input: HotelRoomUpdateInput) => api.patch<HotelRoom>(`/hotel/rooms/${id}`, input),
  remove: (id: string) => api.delete<HotelRoom>(`/hotel/rooms/${id}`),
};
