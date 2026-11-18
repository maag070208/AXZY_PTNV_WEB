// Habitaciones del hotel (catálogo de habitaciones y tipos).
export const HOTEL_ROOM_STATUSES = ["CLEANING", "INSPECTION", "AVAILABLE", "OCCUPIED", "MAINTENANCE", "OUT_OF_SERVICE"] as const;
export type HotelRoomStatus = (typeof HOTEL_ROOM_STATUSES)[number];

export interface HotelRoom {
  id: string;
  zoneId: string;
  typeId: string;
  number: string;
  kingBeds: number;
  queenBeds: number;
  sofaBeds: number;
  bathrooms: number;
  status: HotelRoomStatus;
  notes: string | null;
  active: boolean;
  zone?: { id: string; name: string; kind?: string; parentId?: string | null };
  type?: { id: string; name: string; beds?: number; capacity?: number; kitId?: string | null };
}

export interface HotelRoomTypeOption {
  id: string;
  name: string;
  active: boolean;
}

export interface HotelRoomCreateInput {
  zoneId: string;
  typeId: string;
  number: string;
  kingBeds: number;
  queenBeds: number;
  sofaBeds: number;
  bathrooms: number;
  notes?: string | null;
}

/** Al editar se puede mover la habitación a otro piso (zona tipo FLOOR). */
export interface HotelRoomUpdateInput {
  zoneId?: string;
  typeId?: string;
  number?: string;
  kingBeds?: number;
  queenBeds?: number;
  sofaBeds?: number;
  bathrooms?: number;
  notes?: string | null;
  active?: boolean;
}
