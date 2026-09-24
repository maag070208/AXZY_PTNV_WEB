import { Text, View } from "@react-pdf/renderer";
import { pdfTheme } from "./theme";

interface Props {
  /**
   * Números de página cuando el documento declara las páginas manualmente.
   * Si se omiten, el pie toma los números reales de `@react-pdf/renderer`
   * (render prop) para documentos con paginación nativa.
   */
  pageIndex?: number;
  pageCount?: number;
  note?: string;
}

export default function PdfFooter({ pageIndex, pageCount, note }: Props) {
  const manual =
    pageIndex !== undefined && pageCount !== undefined ? { pageIndex, pageCount } : null;
  return (
    <View style={pdfTheme.footer} fixed>
      <Text style={pdfTheme.footerText}>
        {note ?? "Puerto Nuevo Hotel y Villas — Sistema de Control de Activos"}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {manual ? (
          <Text style={pdfTheme.footerPage}>
            Página {manual.pageIndex + 1} de {manual.pageCount}
          </Text>
        ) : (
          <Text
            style={pdfTheme.footerPage}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        )}
        <Text style={pdfTheme.footerPowered}>powered by axzy.dev</Text>
      </View>
    </View>
  );
}
