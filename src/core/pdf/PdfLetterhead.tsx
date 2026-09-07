import { Image, Text, View } from "@react-pdf/renderer";
import { LOGO_PUERTO_NUEVO_BASE64 } from "@core/assets/logoPuertoNuevo";
import { pdfTheme } from "./theme";

interface Props {
  title: string;
  pageIndex: number;
  pageCount: number;
  generatedAt: string;
}

// Membrete institucional compartido por los reportes del sistema (Entregas,
// Asignados, Dispositivos). Se renderiza igual en cada página para que el
// documento se lea como una sola pieza profesional, no como una tabla suelta.
export default function PdfLetterhead({ title, pageIndex, pageCount, generatedAt }: Props) {
  return (
    <View>
      <View style={pdfTheme.band}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={pdfTheme.logoBadge}>
            <Image src={LOGO_PUERTO_NUEVO_BASE64} style={pdfTheme.logoImg} />
          </View>
          <View style={pdfTheme.bandTextWrap}>
            <Text style={pdfTheme.bandHotel}>Puerto Nuevo Hotel & Villas</Text>
            <Text style={pdfTheme.bandDoc}>{title}</Text>
          </View>
        </View>
        <View style={pdfTheme.bandMetaWrap}>
          <Text style={pdfTheme.bandMeta}>
            Generado: <Text style={pdfTheme.bandMetaStrong}>{generatedAt}</Text>
          </Text>
          <Text style={pdfTheme.bandMeta}>
            Página <Text style={pdfTheme.bandMetaStrong}>{pageIndex + 1}</Text> de {pageCount}
          </Text>
        </View>
      </View>
      <View style={pdfTheme.bandAccentLine} />
    </View>
  );
}
