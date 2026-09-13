import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { useTranslation } from "react-i18next";
import type { InventoryMovement, MovementType } from "@entities/inventory-movement";
import type { Location } from "@entities/location";
import { formatLocation } from "@entities/location";
import { PDF_COLORS, pdfTheme } from "@shared/pdf/theme";
import { formatDate as fmtDate } from "@shared/i18n";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import PdfFooter from "@shared/pdf/PdfFooter";

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

const formatDate = (dateStr: string) =>
  fmtDate(dateStr, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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
  const { t: tt } = useTranslation(["inventory"]);
  const today = formatReportDate();
  const totalDevices = locations.reduce((sum, l) => sum + (l._count?.devices ?? 0), 0);

  const pages: InventoryMovement[][] = [];
  for (let i = 0; i < movements.length; i += ROWS_PER_PAGE) {
    pages.push(movements.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const typeLabel = (tipo: MovementType) => tt(`typeLabels.${tipo}`);

  return (
    <Document title={tt("report.title")} author="Puerto Nuevo Hotel y Villas">
      {pages.map((pageMovements, pageIdx) => (
        <Page key={pageIdx} size="LETTER" style={pdfTheme.page}>
          <PdfLetterhead title={tt("report.title")} pageIndex={pageIdx} pageCount={pages.length} generatedAt={today} />

          <View style={pdfTheme.content}>
            {pageIdx === 0 && (
              <>
                <View style={pdfTheme.summaryRow}>
                  <View style={pdfTheme.summaryCard}>
                    <Text style={pdfTheme.summaryValue}>{locations.length}</Text>
                    <Text style={pdfTheme.summaryLabel}>{tt("report.summaryLocations")}</Text>
                  </View>
                  <View style={[pdfTheme.summaryCard, { borderTopColor: PDF_COLORS.success }]}>
                    <Text style={[pdfTheme.summaryValue, { color: PDF_COLORS.success }]}>{totalDevices}</Text>
                    <Text style={pdfTheme.summaryLabel}>{tt("report.summaryDevices")}</Text>
                  </View>
                  <View style={[pdfTheme.summaryCard, { borderTopColor: PDF_COLORS.bandAccent }]}>
                    <Text style={[pdfTheme.summaryValue, { color: PDF_COLORS.band }]}>{movements.length}</Text>
                    <Text style={pdfTheme.summaryLabel}>{tt("report.summaryMovements")}</Text>
                  </View>
                </View>

                <View style={{ marginBottom: 16 }}>
                  {locations.map((loc) => (
                    <View key={loc.id} style={styles.locationCard}>
                      <View>
                        <Text style={styles.locationName}>{formatLocation(loc)}</Text>
                        {loc.descripcion && <Text style={styles.locationDesc}>{loc.descripcion}</Text>}
                      </View>
                      <Text style={styles.locationCount}>{loc._count?.devices ?? 0} {tt("report.devicesUnit")}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: PDF_COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              {tt("report.kardex")}
            </Text>
            <View style={pdfTheme.tableHeader}>
              <Text style={{ ...pdfTheme.tableHeaderText, flex: 2 }}>{tt("report.colDate")}</Text>
              <Text style={{ ...pdfTheme.tableHeaderText, flex: 1.5 }}>{tt("report.colType")}</Text>
              <Text style={{ ...pdfTheme.tableHeaderText, flex: 2 }}>{tt("report.colDevice")}</Text>
              <Text style={{ ...pdfTheme.tableHeaderText, flex: 2 }}>{tt("report.colLocation")}</Text>
              <Text style={{ ...pdfTheme.tableHeaderText, flex: 1.5 }}>{tt("report.colUser")}</Text>
            </View>
            {pageMovements.map((m, i) => (
              <View key={m.id} style={i % 2 === 1 ? pdfTheme.tableRowAlt : pdfTheme.tableRow}>
                <Text style={{ ...pdfTheme.cellMuted, flex: 2 }}>{formatDate(m.createdAt)}</Text>
                <Text style={{ ...pdfTheme.cellBold, flex: 1.5, color: TIPO_COLORS[m.tipo] }}>{typeLabel(m.tipo)}</Text>
                <Text style={{ ...pdfTheme.cellBold, flex: 2 }}>{m.device?.controlActivos ?? "—"}</Text>
                <Text style={{ ...pdfTheme.cell, flex: 2 }}>{m.location ? formatLocation(m.location) : "—"}</Text>
                <Text style={{ ...pdfTheme.cell, flex: 1.5 }}>{m.user?.name ?? "—"}</Text>
              </View>
            ))}
          </View>

          <PdfFooter pageIndex={pageIdx} pageCount={pages.length} note={tt("report.note")} />
        </Page>
      ))}
    </Document>
  );
};