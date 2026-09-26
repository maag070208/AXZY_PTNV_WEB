import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import type { Prestamo } from "@entities/inventario";
import CartaResponsivaPDF from "../ui/CartaResponsivaPDF";

export const descargarCartaPDF = async (prestamo: Prestamo): Promise<void> => {
  const blob = await pdf(
    createElement(CartaResponsivaPDF, { prestamo }) as any
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${prestamo.consecutivo}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};