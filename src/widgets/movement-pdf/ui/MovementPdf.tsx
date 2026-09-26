import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { useTranslation } from "react-i18next";
import type { Movement } from "@entities/inventory";
import { PDF_COLORS, pdfTheme, badgeStyleFor } from "@shared/pdf/theme";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import PdfFooter from "@shared/pdf/PdfFooter";

interface Props {
  movement: Movement;
}

const styles = StyleSheet.create({
  kvRow: { flexDirection: "row", marginBottom: 6 },
  kvLabel: { width: 105, fontSize: 7.5, fontFamily: "Helvetica-Bold", color: PDF_COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4, paddingTop: 1 },
  kvValueMuted: { flex: 1, fontSize: 9, color: "#334155" },
  colNumber: { width: 26 },
  colProduct: { width: 150 },
  colBrand: { width: 95 },
  colModel: { width: 95 },
  colQty: { width: 42 },
  colCond: { width: 80 },
});

export default function MovementPdf({ movement }: Props) {
  const { t } = useTranslation(["inventory"]);
  const doc = t("movements.doc", { returnObjects: true }) as Record<string, string>;
  const today = new Date().toLocaleDateString("es-MX");
  const folio = `MV-${movement.id.slice(0, 8).toUpperCase()}`;
  const statusBadge = movement.status === "CANCELLED" ? badgeStyleFor("danger") : badgeStyleFor("success");
  const custodian = movement.custodian?.name ?? "—";
  const preparedBy = movement.createdBy?.name ?? "—";

  const ROWS_PER_PAGE = 20;
  const itemChunks: (typeof movement.items)[] = [];
  for (let i = 0; i < movement.items.length; i += ROWS_PER_PAGE) {
    itemChunks.push(movement.items.slice(i, i + ROWS_PER_PAGE));
  }
  if (itemChunks.length === 0) itemChunks.push([]);

  return (
    <Document title={`${doc.title} — ${folio}`} author="Puerto Nuevo Hotel y Villas">
      {itemChunks.map((chunk, pageIdx) => (
        <Page key={pageIdx} size="LETTER" style={pdfTheme.page}>
          <PdfLetterhead title={doc.title} pageIndex={pageIdx} pageCount={itemChunks.length} generatedAt={today} />

          <View style={pdfTheme.content}>
            {pageIdx === 0 && (
              <>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
                  <View style={[pdfTheme.summaryCard, { borderTopColor: PDF_COLORS.band }]}>
                    <Text style={pdfTheme.summaryValue}>{doc.status}</Text>
                    <Text style={pdfTheme.summaryLabel}>{movement.status === "CANCELLED" ? doc.cancelledStatus : doc.activeStatus}</Text>
                  </View>
                  <View style={[pdfTheme.summaryCard, { borderTopColor: PDF_COLORS.bandAccent }]}>
                    <Text style={pdfTheme.summaryValue}>{folio}</Text>
                    <Text style={pdfTheme.summaryLabel}>{doc.folio}</Text>
                  </View>
                  <View style={[pdfTheme.summaryCard, { borderTopColor: PDF_COLORS.success }]}>
                    <Text style={pdfTheme.summaryValue}>{movement.items.reduce((s, d) => s + d.quantity, 0)}</Text>
                    <Text style={pdfTheme.summaryLabel}>{doc.pieces}</Text>
                  </View>
                </View>

                <View style={styles.kvRow}>
                  <Text style={styles.kvLabel}>{doc.type}</Text>
                  <Text style={[styles.kvValueMuted, { fontSize: 9.5, fontFamily: "Helvetica-Bold" }]}>{t(`typeLabels.${movement.type}`)}</Text>
                </View>
                <View style={styles.kvRow}>
                  <Text style={styles.kvLabel}>{doc.record}</Text>
                  <Text style={styles.kvValueMuted}>{preparedBy}</Text>
                </View>
                <View style={styles.kvRow}>
                  <Text style={styles.kvLabel}>{doc.custodian}</Text>
                  <Text style={styles.kvValueMuted}>{custodian}</Text>
                </View>
                {movement.reason && (
                  <View style={styles.kvRow}>
                    <Text style={styles.kvLabel}>{doc.reason}</Text>
                    <Text style={styles.kvValueMuted}>{movement.reason}</Text>
                  </View>
                )}
                {movement.notes && (
                  <View style={styles.kvRow}>
                    <Text style={styles.kvLabel}>{doc.notes}</Text>
                    <Text style={styles.kvValueMuted}>{movement.notes}</Text>
                  </View>
                )}
              </>
            )}

            <View style={pdfTheme.tableHeader}>
              <View style={styles.colNumber}><Text style={pdfTheme.tableHeaderText}>#</Text></View>
              <View style={styles.colProduct}><Text style={pdfTheme.tableHeaderText}>{doc.itemProduct}</Text></View>
              <View style={styles.colBrand}><Text style={pdfTheme.tableHeaderText}>{doc.itemBrand}</Text></View>
              <View style={styles.colModel}><Text style={pdfTheme.tableHeaderText}>{doc.itemModel}</Text></View>
              <View style={styles.colQty}><Text style={[pdfTheme.tableHeaderText, { textAlign: "center" }]}>{doc.itemQuantity}</Text></View>
              <View style={styles.colCond}><Text style={pdfTheme.tableHeaderText}>{doc.itemCondition}</Text></View>
            </View>

            {chunk.map((d, i) => (
              <View key={d.id} style={i % 2 === 0 ? pdfTheme.tableRow : pdfTheme.tableRowAlt}>
                <View style={styles.colNumber}><Text style={pdfTheme.cellMuted}>{i + 1}</Text></View>
                <View style={styles.colProduct}><Text style={pdfTheme.cellBold}>{d.device?.name ?? "—"}</Text></View>
                <View style={styles.colBrand}><Text style={pdfTheme.cell}>{d.device?.brand ?? "—"}</Text></View>
                <View style={styles.colModel}><Text style={pdfTheme.cell}>{d.device?.model ?? "—"}</Text></View>
                <View style={styles.colQty}><Text style={[pdfTheme.cellBold, { textAlign: "center" }]}>{d.quantity}</Text></View>
                <View style={styles.colCond}><Text style={pdfTheme.cell}>{d.condition ?? "—"}</Text></View>
              </View>
            ))}
          </View>

          <PdfFooter pageIndex={pageIdx} pageCount={itemChunks.length} />
        </Page>
      ))}
    </Document>
  );
}