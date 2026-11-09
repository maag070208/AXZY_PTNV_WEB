import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import type { PurchaseOrderDetail } from "@entities/hotel-linen";
import HotelPurchaseOrderPdf from "./HotelPurchaseOrderPdf";

/** Genera y descarga el PDF de la OC del hotel (`OC-H-0001.pdf`). */
export const downloadHotelPurchaseOrderPdf = async (order: PurchaseOrderDetail): Promise<void> => {
  const blob = await pdf(createElement(HotelPurchaseOrderPdf, { order }) as never).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${order.folio}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
