import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { useTranslation } from "react-i18next";
import type { Movimiento } from "@entities/inventario";
import { PDF_COLORS, pdfTheme, badgeStyleFor } from "@shared/pdf/theme";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import PdfFooter from "@shared/pdf/PdfFooter";

interface Props {
  movimiento: Movimiento;
}

const styles = StyleSheet.create({
  kvRow: { flexDirection: "row", marginBottom: 6 },
  kvLabel: { width: 105, fontSize: 7.5, fontFamily: "Helvetica-Bold", color: PDF_COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4, paddingTop: 1 },
  kvValueMuted: { flex: 1, fontSize: 9, color: "#334155" },
  colNumero: { width: 26 },
  colProducto: { width: 150 },
  colMarca: { width: 95 },
  colModelo: { width: 95 },
  colCant: { width: 42 },
  colCond: { width: 80 },
});

export default function MovimientoPDF({ movimiento }: Props) {
  const { t } = useTranslation(["inventario"]);
  const doc = t("movimientos.doc", { returnObjects: true }) as Record<string, string>;
  const today = new Date().toLocaleDateString("es-MX");
  const folio = `MV-${movimiento.id.slice(0, 8).toUpperCase()}`;
  const estadoBadge = movimiento.status === "CANCELADO" ? badgeStyleFor("danger") : badgeStyleFor("success");
  const responsable = movimiento.responsable?.name ?? "—";
  const elaboro = movimiento.usuario?.name ?? "—";

  const ROWS_PER_PAGE = 20;
  const detalleChunks: (typeof movimiento.detalles)[] = [];
  for (let i = 0; i < movimiento.detalles.length; i += ROWS_PER_PAGE) {
    detalleChunks.push(movimiento.detalles.slice(i, i + ROWS_PER_PAGE));
  }
  if (detalleChunks.length === 0) detalleChunks.push([]);

  return (
    <Document title={`${doc.title} — ${folio}`} author="Puerto Nuevo Hotel y Villas">
      {detalleChunks.map((chunk, pageIdx) => (
        <Page key={pageIdx} size="LETTER" style={pdfTheme.page}>
          <PdfLetterhead title={doc.title} pageIndex={pageIdx} pageCount={detalleChunks.length} generatedAt={today} />

          <View style={pdfTheme.content}>
            {pageIdx === 0 && (
              <>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
                  <View style={[pdfTheme.summaryCard, { borderTopColor: PDF_COLORS.band }]}>
                    <Text style={pdfTheme.summaryValue}>{doc.estado}</Text>
                    <Text style={pdfTheme.summaryLabel}>{movimiento.status === "CANCELADO" ? doc.estadoCancelado : doc.estadoActivo}</Text>
                  </View>
                  <View style={[pdfTheme.summaryCard, { borderTopColor: PDF_COLORS.bandAccent }]}>
                    <Text style={pdfTheme.summaryValue}>{folio}</Text>
                    <Text style={pdfTheme.summaryLabel}>{doc.folio}</Text>
                  </View>
                  <View style={[pdfTheme.summaryCard, { borderTopColor: PDF_COLORS.success }]}>
                    <Text style={pdfTheme.summaryValue}>{movimiento.detalles.reduce((s, d) => s + d.cantidad, 0)}</Text>
                    <Text style={pdfTheme.summaryLabel}>{doc.piezas}</Text>
                  </View>
                </View>

                <View style={styles.kvRow}>
                  <Text style={styles.kvLabel}>{doc.tipo}</Text>
                  <Text style={[styles.kvValueMuted, { fontSize: 9.5, fontFamily: "Helvetica-Bold" }]}>{t(`typeLabels.${movimiento.tipo}`)}</Text>
                </View>
                <View style={styles.kvRow}>
                  <Text style={styles.kvLabel}>{doc.registro}</Text>
                  <Text style={styles.kvValueMuted}>{elaboro}</Text>
                </View>
                <View style={styles.kvRow}>
                  <Text style={styles.kvLabel}>{doc.responsable}</Text>
                  <Text style={styles.kvValueMuted}>{responsable}</Text>
                </View>
                {movimiento.motivo && (
                  <View style={styles.kvRow}>
                    <Text style={styles.kvLabel}>{doc.motivo}</Text>
                    <Text style={styles.kvValueMuted}>{movimiento.motivo}</Text>
                  </View>
                )}
                {movimiento.observaciones && (
                  <View style={styles.kvRow}>
                    <Text style={styles.kvLabel}>{doc.observaciones}</Text>
                    <Text style={styles.kvValueMuted}>{movimiento.observaciones}</Text>
                  </View>
                )}
              </>
            )}

            <View style={pdfTheme.tableHeader}>
              <View style={styles.colNumero}><Text style={pdfTheme.tableHeaderText}>#</Text></View>
              <View style={styles.colProducto}><Text style={pdfTheme.tableHeaderText}>{doc.detalleProducto}</Text></View>
              <View style={styles.colMarca}><Text style={pdfTheme.tableHeaderText}>{doc.detalleMarca}</Text></View>
              <View style={styles.colModelo}><Text style={pdfTheme.tableHeaderText}>{doc.detalleModelo}</Text></View>
              <View style={styles.colCant}><Text style={[pdfTheme.tableHeaderText, { textAlign: "center" }]}>{doc.detalleCantidad}</Text></View>
              <View style={styles.colCond}><Text style={pdfTheme.tableHeaderText}>{doc.detalleCondicion}</Text></View>
            </View>

            {chunk.map((d, i) => (
              <View key={d.id} style={i % 2 === 0 ? pdfTheme.tableRow : pdfTheme.tableRowAlt}>
                <View style={styles.colNumero}><Text style={pdfTheme.cellMuted}>{i + 1}</Text></View>
                <View style={styles.colProducto}><Text style={pdfTheme.cellBold}>{d.dispositivo?.nombre ?? "—"}</Text></View>
                <View style={styles.colMarca}><Text style={pdfTheme.cell}>{d.dispositivo?.marca ?? "—"}</Text></View>
                <View style={styles.colModelo}><Text style={pdfTheme.cell}>{d.dispositivo?.modelo ?? "—"}</Text></View>
                <View style={styles.colCant}><Text style={[pdfTheme.cellBold, { textAlign: "center" }]}>{d.cantidad}</Text></View>
                <View style={styles.colCond}><Text style={pdfTheme.cell}>{d.condicion ?? "—"}</Text></View>
              </View>
            ))}
          </View>

          <PdfFooter pageIndex={pageIdx} pageCount={detalleChunks.length} />
        </Page>
      ))}
    </Document>
  );
}