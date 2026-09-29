import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import type { PurchaseOrderDetail } from "@entities/kitchen";
import PurchaseOrderPdf from "../ui/PurchaseOrderPdf";

/** Genera y descarga el PDF de la orden de compra (`OC-0001.pdf`). */
export const downloadPurchaseOrderPdf = async (order: PurchaseOrderDetail): Promise<void> => {
  const blob = await pdf(createElement(PurchaseOrderPdf, { order }) as any).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${order.number}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
