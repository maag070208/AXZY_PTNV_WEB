import { Text, View } from "@react-pdf/renderer";
import { pdfTheme } from "./theme";

interface Props {
  pageIndex: number;
  pageCount: number;
  note?: string;
}

export default function PdfFooter({ pageIndex, pageCount, note }: Props) {
  return (
    <View style={pdfTheme.footer} fixed>
      <Text style={pdfTheme.footerText}>
        {note ?? "Puerto Nuevo Hotel y Villas — Sistema de Control de Activos"}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={pdfTheme.footerPage}>
          Página {pageIndex + 1} de {pageCount}
        </Text>
        <Text style={pdfTheme.footerPowered}>powered by axzy.dev</Text>
      </View>
    </View>
  );
}
