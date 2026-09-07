import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { InventoryMovement, MovementType } from "@core/api/inventory.api";
import type { Location } from "@core/api/devices.api";
import { PDF_COLORS, pdfTheme } from "@core/pdf/theme";
import PdfLetterhead from "@core/pdf/PdfLetterhead";
import PdfFooter from "@core/pdf/PdfFooter";

interface Props {
  movements: InventoryMovement[];
  locations: Location[];
}

const TIPO_COLORS: Record<MovementType, string> = {
  ENTRADA: PDF_COLORS.success,
  SALIDA: PDF_COLORS.warning,
  TRASLADO: PDF_COLORS.band,
  BAJA: PDF_COLORS.danger,
  PRESTAMO: "#a855f7",
  DEVOLUCION: "#14b8a6",
};

const TIPO_LABELS: Record<MovementType, string> = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  TRASLADO: "Traslado",
  BAJA: "Baja",
  PRESTAMO: "Préstamo",
  DEVOLUCION: "Devolución",
};

const formatLocation = (loc?: Location | null): string => {
  if (!loc) return "Sin ubicación";
  const parts = [loc.lugar, loc.subLugar, loc.numero].filter(Boolean);
  return parts.length > 0 ? parts.join("-") : "Ubicación";
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatReportDate = (): string => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = now.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

const styles = StyleSheet.create({
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: PDF_COLORS.light,
    borderRadius: 4,
    padding: 8,
    marginBottom: 5,
    borderWidth: 0.5,
    borderColor: PDF_COLORS.border,
  },
  locationName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: PDF_COLORS.ink },
  locationDesc: { fontSize: 7.3, color: PDF_COLORS.muted, marginTop: 1 },
  locationCount: { fontSize: 11, fontFamily: "Helvetica-Bold", color: PDF_COLORS.band },
});

const ROWS_PER_PAGE = 25;

export const InventoryPDF = ({ movements, locations }: Props) => {
  const today = formatReportDate();
  const totalDevices = locations.reduce((sum, l) => sum + (l._count?.devices ?? 0), 0);

  const pages: InventoryMovement[][] = [];
  for (let i = 0; i < movements.length; i += ROWS_PER_PAGE) {
    pages.push(movements.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  return (
    <Document title="Reporte de Inventario" author="Puerto Nuevo Hotel y Villas">
      {pages.map((pageMovements, pageIdx) => (
        <Page key={pageIdx} size="LETTER" style={pdfTheme.page}>
          <PdfLetterhead title="Reporte de Inventario" pageIndex={pageIdx} pageCount={pages.length} generatedAt={today} />

          <View style={pdfTheme.content}>
            {pageIdx === 0 && (
              <>
                <View style={pdfTheme.summaryRow}>
                  <View style={pdfTheme.summaryCard}>
                    <Text style={pdfTheme.summaryValue}>{locations.length}</Text>
                    <Text style={pdfTheme.summaryLabel}>Ubicaciones</Text>
                  </View>
                  <View style={[pdfTheme.summaryCard, { borderTopColor: PDF_COLORS.success }]}>
                    <Text style={[pdfTheme.summaryValue, { color: PDF_COLORS.success }]}>{totalDevices}</Text>
                    <Text style={pdfTheme.summaryLabel}>Dispositivos en ubicación</Text>
                  </View>
                  <View style={[pdfTheme.summaryCard, { borderTopColor: PDF_COLORS.bandAccent }]}>
                    <Text style={[pdfTheme.summaryValue, { color: PDF_COLORS.band }]}>{movements.length}</Text>
                    <Text style={pdfTheme.summaryLabel}>Movimientos</Text>
                  </View>
                </View>

                <View style={{ marginBottom: 16 }}>
                  {locations.map((loc) => (
                    <View key={loc.id} style={styles.locationCard}>
                      <View>
                        <Text style={styles.locationName}>{formatLocation(loc)}</Text>
                        {loc.descripcion && <Text style={styles.locationDesc}>{loc.descripcion}</Text>}
                      </View>
                      <Text style={styles.locationCount}>{loc._count?.devices ?? 0} disp.</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: PDF_COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              Kardex — Historial de Movimientos
            </Text>
            <View style={pdfTheme.tableHeader}>
              <Text style={{ ...pdfTheme.tableHeaderText, flex: 2 }}>Fecha</Text>
              <Text style={{ ...pdfTheme.tableHeaderText, flex: 1.5 }}>Tipo</Text>
              <Text style={{ ...pdfTheme.tableHeaderText, flex: 2 }}>Dispositivo</Text>
              <Text style={{ ...pdfTheme.tableHeaderText, flex: 2 }}>Ubicación</Text>
              <Text style={{ ...pdfTheme.tableHeaderText, flex: 1.5 }}>Usuario</Text>
            </View>
            {pageMovements.map((m, i) => (
              <View key={m.id} style={i % 2 === 1 ? pdfTheme.tableRowAlt : pdfTheme.tableRow}>
                <Text style={{ ...pdfTheme.cellMuted, flex: 2 }}>{formatDate(m.createdAt)}</Text>
                <Text style={{ ...pdfTheme.cellBold, flex: 1.5, color: TIPO_COLORS[m.tipo] }}>{TIPO_LABELS[m.tipo]}</Text>
                <Text style={{ ...pdfTheme.cellBold, flex: 2 }}>{m.device?.controlActivos ?? "—"}</Text>
                <Text style={{ ...pdfTheme.cell, flex: 2 }}>{m.location ? formatLocation(m.location) : "—"}</Text>
                <Text style={{ ...pdfTheme.cell, flex: 1.5 }}>{m.user?.name ?? "—"}</Text>
              </View>
            ))}
          </View>

          <PdfFooter pageIndex={pageIdx} pageCount={pages.length} note="Puerto Nuevo Hotel y Villas — Sistema de Inventario" />
        </Page>
      ))}
    </Document>
  );
};
