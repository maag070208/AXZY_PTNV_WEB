import { saveAs } from "file-saver";
import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import type { MaterialOutput, SalidaFilters } from "@core/api/salidas.api";
import SalidaBitacoraPDF from "../components/SalidaBitacoraPDF";

export const downloadSalidasPDF = async (
  rows: MaterialOutput[],
  filters?: SalidaFilters
): Promise<void> => {
  const blob = await pdf(
    createElement(SalidaBitacoraPDF, { rows, area: filters?.area }) as any
  ).toBlob();
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = now.getFullYear();
  saveAs(blob, `bitacora_salida_material_${yy}${mm}${dd}.pdf`);
};
