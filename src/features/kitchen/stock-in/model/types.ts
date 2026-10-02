import type { KitchenItemRow } from "@entities/kitchen";

/** Un renglón de la entrada (cada uno crea un lote al registrar). */
export interface StockInLine {
  key: number;
  itemId: string;
  quantity: string;
  lotCode: string;
  expiresAt: Date | null;
  unitCost: string;
}

export const emptyStockInLine = (key: number): StockInLine => ({
  key,
  itemId: "",
  quantity: "",
  lotCode: "",
  expiresAt: null,
  unitCost: "",
});

/** Clave `YYYY-MM-DD` del navegador (el día que capturó el usuario). */
export const localDay = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Renglón completo: artículo, cantidad > 0 y caducidad si el artículo la controla. */
export const isStockInLineComplete = (line: StockInLine, item?: KitchenItemRow): boolean => {
  if (!item || Number(line.quantity) <= 0) return false;
  if (item.tracksExpiry && !line.expiresAt) return false;
  return true;
};
