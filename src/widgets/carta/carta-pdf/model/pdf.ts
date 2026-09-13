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
  // El nombre del archivo es siempre "SIS-001" — nunca nuestro folio.
  const filename = opts.filename || "SIS-001.pdf";

   
  const blob = await pdf(createElement(CartaPDF, { carta: opts.carta }) as any).toBlob();
  saveAs(blob, filename);
};

// Genera el PDF y lo abre en una pestaña nueva (sin guardarlo en disco).
export const openCartaPDF = async (opts: DownloadOpcions): Promise<void> => {
  const blob = await pdf(createElement(CartaPDF, { carta: opts.carta }) as any).toBlob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};