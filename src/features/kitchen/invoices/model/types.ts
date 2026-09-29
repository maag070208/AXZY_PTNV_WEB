/** Renglón en edición dentro del formulario de factura. */
export interface InvoiceDraftLine {
  key: number;
  itemId: string;
  quantity: string;
  unitCost: string;
  /** Renglón de la OC al que corresponde (para el cotejo); null si es libre. */
  purchaseOrderLineId: string | null;
}

export const emptyInvoiceDraftLine = (key: number): InvoiceDraftLine => ({
  key,
  itemId: "",
  quantity: "",
  unitCost: "",
  purchaseOrderLineId: null,
});

/** Clave `YYYY-MM-DD` del navegador. */
export const localDay = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
