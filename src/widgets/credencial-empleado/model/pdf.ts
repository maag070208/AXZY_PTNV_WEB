import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import type { PersonalProfile } from "@entities/personal";
import CredencialEmpleadoPDF from "../ui/CredencialEmpleadoPDF";

export interface CredencialPDFInput {
  profile: PersonalProfile;
  qrDataUrl: string | null;
  fotoDataUrl?: string | null;
  iniciales?: string;
}

/**
 * Genera el blob del PDF de la credencial igual que `descargarActaPDF` y
 * dispara la descarga con el nombre `credencial-<id>.pdf`.
 */
export const descargarCredencialPDF = async ({
  profile,
  qrDataUrl,
  fotoDataUrl = null,
  iniciales = "—",
}: CredencialPDFInput): Promise<void> => {
  const blob = await pdf(
    createElement(CredencialEmpleadoPDF, {
      profile,
      qrDataUrl,
      fotoDataUrl,
      iniciales,
    }) as any
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `credencial-${profile.numeroEmpleado ?? profile.id}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
