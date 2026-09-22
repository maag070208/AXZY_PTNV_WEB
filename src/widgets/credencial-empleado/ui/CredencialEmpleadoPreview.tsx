import { PDFViewer } from "@react-pdf/renderer";
import type { PersonalProfile } from "@entities/personal";
import CredencialEmpleadoPDF from "./CredencialEmpleadoPDF";

export default function CredencialEmpleadoPreview({
  profile,
  qrDataUrl,
  fotoDataUrl,
  iniciales,
}: {
  profile: PersonalProfile;
  qrDataUrl: string | null;
  fotoDataUrl?: string | null;
  iniciales?: string;
}) {
  return (
    <PDFViewer
      style={{ width: "100%", height: 720, border: "none", borderRadius: 16 }}
      showToolbar
    >
      <CredencialEmpleadoPDF
        profile={profile}
        qrDataUrl={qrDataUrl}
        fotoDataUrl={fotoDataUrl}
        iniciales={iniciales}
      />
    </PDFViewer>
  );
}
