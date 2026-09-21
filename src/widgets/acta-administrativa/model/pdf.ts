import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import type { ActaAdministrativa } from "@entities/personal";
import ActaAdministrativaPDF from "../ui/ActaAdministrativaPDF";

export const descargarActaPDF = async (acta: ActaAdministrativa): Promise<void> => {
  const blob = await pdf(
    createElement(ActaAdministrativaPDF, { acta }) as any
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `acta-administrativa-${acta.user.numeroEmpleado ?? acta.user.id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};