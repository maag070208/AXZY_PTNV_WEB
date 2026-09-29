/** Renglón en edición dentro del formulario de orden de compra. */
export interface OrderDraftLine {
  key: number;
  itemId: string;
  quantity: string;
  unitCost: string;
}

export const emptyOrderDraftLine = (key: number): OrderDraftLine => ({
  key,
  itemId: "",
  quantity: "",
  unitCost: "",
});

/** Clave `YYYY-MM-DD` del navegador. */
export const localDay = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
