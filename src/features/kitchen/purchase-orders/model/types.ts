/** Renglón en edición dentro del formulario de orden de compra. */
export interface OrderDraftLine {
  key: number;
  itemId: string;
  quantity: string;
  unitCost: string;
  /** Cantidad y costo capturados en la unidad de compra del proveedor (caja, bulto). */
  usePurchaseUnit: boolean;
  /**
   * IVA del renglón: null = el del artículo (automático), "" = sin IVA,
   * o el id de una tasa del catálogo.
   */
  taxRateId: string | null;
}

export const emptyOrderDraftLine = (key: number): OrderDraftLine => ({
  key,
  itemId: "",
  quantity: "",
  unitCost: "",
  usePurchaseUnit: false,
  taxRateId: null,
});

/** Clave `YYYY-MM-DD` del navegador. */
export const localDay = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
