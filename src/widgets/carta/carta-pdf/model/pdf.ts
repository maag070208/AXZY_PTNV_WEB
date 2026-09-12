import { saveAs } from "file-saver";
import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import type { CartaResponsiva } from "@entities/carta";
import CartaPDF from "../ui/CartaPDF";

interface DownloadOpcions {
  consecutivo: string;
  fecha: string;
  carta: CartaResponsiva;
  filename?: string;
}

export const downloadCartaPDF = async (
  _element: HTMLElement | null,
  opts: DownloadOpcions
): Promise<void> => {
  const controlActivos =
    opts.carta.items?.[0]?.controlActivos || "SIN-ACTIVO";
  const filename =
    opts.filename ||
    `${opts.consecutivo || "F-MMTO-XXXX"}_${controlActivos}.pdf`;

   
  const blob = await pdf(createElement(CartaPDF, { carta: opts.carta }) as any).toBlob();
  saveAs(blob, filename);
};