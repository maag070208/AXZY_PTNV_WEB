import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { useTranslation } from "react-i18next";
import type { MaterialOutput } from "@entities/salida";
import { PDF_COLORS, pdfTheme, badgeStyleFor } from "@shared/pdf/theme";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import PdfFooter from "@shared/pdf/PdfFooter";

interface Props {
  rows: MaterialOutput[];
  title?: string;
}

const fmtDate = (d: string | null): string => {
  if (!d) return "—";
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = date.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

const motivoBadge = (motivo: MaterialOutput["motivo"]) =>
  motivo === "DANADO" || motivo === "EXTRAVIO"
    ? badgeStyleFor("danger")
    : motivo === "OBSOLETO"
    ? badgeStyleFor("warning")
    : badgeStyleFor("gray");

const styles = StyleSheet.create({
  emptyBadge: { fontSize: 7.5, color: PDF_COLORS.muted },
});

const COL = {
  fecha: 46,
  desc: 132,
  cant: 26,
  depto: 78,
  usuario: 78,
  motivo: 56,
  dispositivo: 66,
};

export default function SalidasPDF({ rows, title }: Props) {
  const { t: tt } = useTranslation(["reports", "salidas"]);
  const reportTitle = title ?? tt("pdf.salidasTitle");
  const today = fmtDate(new Date().toISOString());
  const danados = rows.filter((r) => r.motivo === "DANADO").length;
  const conDispositivo = rows.filter((r) => r.deviceId).length;

  const motivoLabel = (motivo: MaterialOutput["motivo"]) =>
    motivo ? tt(`salidas:motivo.${motivo}`) : "—";

  const summary: Array<{ label: string; value: number; color: string }> = [
    { label: tt("salidas.statTotal"), value: rows.length, color: PDF_COLORS.band },
    { label: tt("pdf.summaryDanados"), value: danados, color: PDF_COLORS.danger },
    { label: tt("pdf.summaryConDispositivo"), value: conDispositivo, color: PDF_COLORS.warning },
  ];

  const ROWS_PER_PAGE = 26;
  const pages: MaterialOutput[][] = [];
  for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
    pages.push(rows.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  return (
    <Document title={reportTitle} author="Puerto Nuevo Hotel y Villas">
      {pages.map((pageRows, pageIdx) => (
        <Page key={pageIdx} size="LETTER" style={pdfTheme.page}>
          <PdfLetterhead title={reportTitle} pageIndex={pageIdx} pageCount={pages.length} generatedAt={today} />

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
              <View style={{ width: COL.fecha }}><Text style={pdfTheme.tableHeaderText}>{tt("salidas.colFecha")}</Text></View>
              <View style={{ width: COL.desc }}><Text style={pdfTheme.tableHeaderText}>{tt("salidas.colDescripcion")}</Text></View>
              <View style={{ width: COL.cant }}><Text style={pdfTheme.tableHeaderText}>{tt("salidas.colCant")}</Text></View>
              <View style={{ width: COL.depto }}><Text style={pdfTheme.tableHeaderText}>{tt("salidas.colDepto")}</Text></View>
              <View style={{ width: COL.usuario }}><Text style={pdfTheme.tableHeaderText}>{tt("salidas.colUsuario")}</Text></View>
              <View style={{ width: COL.motivo }}><Text style={pdfTheme.tableHeaderText}>{tt("salidas.colMotivo")}</Text></View>
              <View style={{ width: COL.dispositivo }}><Text style={pdfTheme.tableHeaderText}>{tt("salidas.colDispositivo")}</Text></View>
            </View>

            {pageRows.map((r, i) => (
              <View key={r.id + i} style={i % 2 === 0 ? pdfTheme.tableRow : pdfTheme.tableRowAlt}>
                <View style={{ width: COL.fecha }}><Text style={pdfTheme.cell}>{fmtDate(r.fecha)}</Text></View>
                <View style={{ width: COL.desc }}>
                  <Text style={pdfTheme.cellDescTitle}>{r.descripcion}</Text>
                  {(r.marca || r.modelo) && (
                    <Text style={pdfTheme.cellDescSub}>{[r.marca, r.modelo].filter(Boolean).join(" · ")}</Text>
                  )}
                </View>
                <View style={{ width: COL.cant }}><Text style={pdfTheme.cell}>{r.cantidad}</Text></View>
                <View style={{ width: COL.depto }}><Text style={pdfTheme.cellMuted}>{r.departamento}</Text></View>
                <View style={{ width: COL.usuario }}><Text style={pdfTheme.cell}>{r.usuario}</Text></View>
                <View style={{ width: COL.motivo }}>
                  {r.motivo ? (
                    <Text style={motivoBadge(r.motivo)}>{motivoLabel(r.motivo)}</Text>
                  ) : (
                    <Text style={styles.emptyBadge}>—</Text>
                  )}
                </View>
                <View style={{ width: COL.dispositivo }}><Text style={pdfTheme.cellMuted}>{r.device?.controlActivos ?? "—"}</Text></View>
              </View>
            ))}
          </View>

          <PdfFooter pageIndex={pageIdx} pageCount={pages.length} />
        </Page>
      ))}
    </Document>
  );
}
