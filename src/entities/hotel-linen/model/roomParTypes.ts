// Dotación por componente (lo que debe haber en el cuarto por cama y por baño).
export type RoomComponent = "ROOM" | "KING_BED" | "QUEEN_BED" | "SOFA_BED" | "BATHROOM";
export const ROOM_COMPONENTS: readonly RoomComponent[] = ["ROOM", "KING_BED", "QUEEN_BED", "SOFA_BED", "BATHROOM"];

export type RoomParKind = "LINEN" | "CONSUMABLE";

export interface RoomParProduct {
  id: string;
  code: string;
  name: string;
  kind: string;
}

export interface RoomParLine {
  component: RoomComponent;
  productId: string;
  quantity: number;
}

export interface RoomParMatrix {
  kind: RoomParKind;
  lines: RoomParLine[];
  products: RoomParProduct[];
}

export interface RoomParSaveInput {
  kind: RoomParKind;
  lines: RoomParLine[];
}
