import { PDFViewer } from "@react-pdf/renderer";
import type { ActaAdministrativa } from "@entities/personal";
import ActaAdministrativaPDF from "./ActaAdministrativaPDF";

export default function ActaAdministrativaPreview({ acta }: { acta: ActaAdministrativa }) {
  return (
    <PDFViewer
      style={{ width: "100%", height: 720, border: "none", borderRadius: 16 }}
      showToolbar
    >
      <ActaAdministrativaPDF acta={acta} />
    </PDFViewer>
  );
}