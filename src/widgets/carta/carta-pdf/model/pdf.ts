import { saveAs } from "file-saver";
import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import { formatFecha } from "@core/utils/dates";
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
  const fechaTxt = formatFecha(opts.fecha).replace(/\//g, "-");
  const controlActivos =
    opts.carta.items?.[0]?.controlActivos || "SIN-ACTIVO";
  const filename =
    opts.filename ||
    `${opts.consecutivo || "F-MMTO-XXXX"}_${controlActivos}.pdf`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(createElement(CartaPDF, { carta: opts.carta }) as any).toBlob();
  saveAs(blob, filename);
};