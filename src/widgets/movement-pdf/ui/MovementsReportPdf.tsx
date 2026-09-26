import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { useTranslation } from "react-i18next";
import type { Movimiento } from "@entities/inventario";
import { PDF_COLORS, pdfTheme, badgeStyleFor } from "@shared/pdf/theme";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import PdfFooter from "@shared/pdf/PdfFooter";
import { TIPO_BADGE_COLOR } from "@entities/inventario/model/movimientoColores";
import { formatFecha } from "@shared/utils/dates";

interface Props {
  movimientos: Movimiento[];
}

const styles = StyleSheet.create({
  colFecha: { width: 50 },
  colFolio: { width: 62 },
  colTipo: { width: 90 },
  colDetalle: { flex: 1 },
  colCant: { width: 32 },
  colResp: { width: 92 },
  colEstado: { width: 52 },
});

const tipoBadgeKind = (tipo: string) => {
  const kind = TIPO_BADGE_COLOR[tipo as keyof typeof TIPO_BADGE_COLOR];
  return badgeStyleFor(kind === "info" ? "gray" : (kind as "success" | "warning" | "danger" | "gray"));
};

export default function MovimientosReportePDF({ movimientos }: Props) {
  const { t } = useTranslation(["inventario"]);
  const doc = t("movimientos.reporteDoc", { returnObjects: true }) as Record<string, string>;
  const today = new Date().toLocaleDateString("es-MX");

  const totales = movimientos.length;
  const entradas = movimientos.filter((m) => ["ENTRADA", "AJUSTE_ENTRADA", "DEVOLUCION"].includes(m.tipo)).length;
  const salidas = movimientos.filter((m) => ["BAJA", "AJUSTE_SALIDA"].includes(m.tipo)).length;
  const piezas = movimientos.reduce((acc, m) => acc + m.detalles.reduce((s, d) => s + d.cantidad, 0), 0);

  const summary = [
    { label: doc.total, value: totales, color: PDF_COLORS.band },
    { label: doc.entradas, value: entradas, color: PDF_COLORS.success },
    { label: doc.salidas, value: salidas, color: PDF_COLORS.danger },
    { label: doc.piezas, value: piezas, color: PDF_COLORS.bandAccent },
  ];

  const ROWS_PER_PAGE = 24;
  const pages: Movimiento[][] = [];
  for (let i = 0; i < movimientos.length; i += ROWS_PER_PAGE) {
    pages.push(movimientos.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  return (
    <Document title={doc.title} author="Puerto Nuevo Hotel y Villas">
      {pages.map((pageRows, pageIdx) => (
        <Page key={pageIdx} size="LETTER" style={pdfTheme.page}>
          <PdfLetterhead title={doc.title} pageIndex={pageIdx} pageCount={pages.length} generatedAt={today} />

          <View style={pdfTheme.content}>
            {pageIdx === 0 && (
              <View style={pdfTheme.summaryRow}>
                {summary.map((s) => (
                  <View key={s.label} style={[pdfTheme.summaryCard, { borderTopColor: s.color }]}>
                    <Text style={[pdfTheme.summaryValue, { color: s.color }]}>{s.value}</Text>
                    <Text style={pdfTheme.summaryLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={pdfTheme.tableHeader}>
              <View style={styles.colFecha}><Text style={pdfTheme.tableHeaderText}>{doc.c_fecha}</Text></View>
              <View style={styles.colFolio}><Text style={pdfTheme.tableHeaderText}>{doc.c_folio}</Text></View>
              <View style={styles.colTipo}><Text style={pdfTheme.tableHeaderText}>{doc.c_tipo}</Text></View>
              <View style={styles.colDetalle}><Text style={pdfTheme.tableHeaderText}>{doc.c_detalle}</Text></View>
              <View style={styles.colCant}><Text style={[pdfTheme.tableHeaderText, { textAlign: "center" }]}>{doc.c_cant}</Text></View>
              <View style={styles.colResp}><Text style={pdfTheme.tableHeaderText}>{doc.c_resp}</Text></View>
              <View style={styles.colEstado}><Text style={pdfTheme.tableHeaderText}>{doc.c_estado}</Text></View>
            </View>

            {pageRows.map((m, i) => (
              <View key={m.id} style={i % 2 === 0 ? pdfTheme.tableRow : pdfTheme.tableRowAlt}>
                <View style={styles.colFecha}><Text style={pdfTheme.cellMuted}>{formatFecha(m.fecha)}</Text></View>
                <View style={styles.colFolio}><Text style={pdfTheme.cellBold}>{`MV-${m.id.slice(0, 8).toUpperCase()}`}</Text></View>
                <View style={styles.colTipo}><Text style={tipoBadgeKind(m.tipo)}>{t(`typeLabels.${m.tipo}`)}</Text></View>
                <View style={styles.colDetalle}>
                  <Text style={pdfTheme.cellDescTitle}>
                    {m.detalles.map((d) => `${d.dispositivo?.nombre ?? "—"} x${d.cantidad}`).join(", ")}
                  </Text>
                </View>
                <View style={styles.colCant}><Text style={[pdfTheme.cellBold, { textAlign: "center" }]}>{m.detalles.reduce((s, d) => s + d.cantidad, 0)}</Text></View>
                <View style={styles.colResp}><Text style={pdfTheme.cell}>{m.responsable?.name ?? m.usuario?.name ?? "—"}</Text></View>
                <View style={styles.colEstado}>
                  <Text style={m.status === "CANCELADO" ? badgeStyleFor("danger") : badgeStyleFor("success")}>
                    {m.status === "CANCELADO" ? doc.d_cancelado : doc.d_activo}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <PdfFooter pageIndex={pageIdx} pageCount={pages.length} />
        </Page>
      ))}
    </Document>
  );
}