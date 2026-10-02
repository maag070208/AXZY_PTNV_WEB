import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import type { PurchaseOrderDetail } from "@entities/kitchen";
import PurchaseOrderPdf from "../ui/PurchaseOrderPdf";

/** Genera el PDF de la orden de compra como blob (para descargar o adjuntar). */
export const buildPurchaseOrderPdf = async (order: PurchaseOrderDetail): Promise<Blob> =>
  pdf(createElement(PurchaseOrderPdf, { order }) as any).toBlob();

/** Genera y descarga el PDF de la orden de compra (`OC-0001.pdf`). */
export const downloadPurchaseOrderPdf = async (order: PurchaseOrderDetail): Promise<void> => {
  const blob = await buildPurchaseOrderPdf(order);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${order.number}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
