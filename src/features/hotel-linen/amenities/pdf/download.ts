import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import AmenityControlPdf, { type AmenityPdfData } from "./AmenityControlPdf";

/** Genera y descarga el PDF del control (`CA-0001.pdf`). */
export const downloadAmenityControlPdf = async (data: AmenityPdfData): Promise<void> => {
  const blob = await pdf(createElement(AmenityControlPdf, { data }) as never).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.folio ?? "CA"}-${data.weekFrom}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
