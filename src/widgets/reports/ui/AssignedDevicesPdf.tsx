import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { useTranslation } from "react-i18next";
import type { AsignadoRow } from "@entities/report";
import { PDF_COLORS, pdfTheme, badgeStyleFor } from "@shared/pdf/theme";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import PdfFooter from "@shared/pdf/PdfFooter";

interface Props {
  rows: AsignadoRow[];
  title?: string;
}

const styles = StyleSheet.create({
  diasAlerta: { fontSize: 7.8, fontFamily: "Helvetica-Bold", color: PDF_COLORS.danger, textAlign: "right" },
  celdaNumero: { textAlign: "right" },
});

const fmtDate = (d: string | null): string => {
  if (!d) return "—";
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = date.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

const origenBadgeStyle = (origen: AsignadoRow["origen"]) =>
  origen === "CARTA" ? badgeStyleFor("success") : origen === "MOVIMIENTO" ? badgeStyleFor("warning") : badgeStyleFor("gray");

// Anchos en puntos; suman ~526 (folio LETTER − padding horizontal de 36×2),
// igual que DevicePDF para que ambos reportes se lean igual.
const COL = {
  activo: 68,
  desc: 114,
  resp: 94,
  depto: 72,
  folio: 50,
  fecha: 50,
  dias: 36,
  origen: 42,
};

export default function AsignadosPDF({ rows, title }: Props) {
  const { t: tt } = useTranslation(["reports"]);
  const reportTitle = title ?? tt("pdf.asignadosTitle");
  const today = fmtDate(new Date().toISOString());
  const totalAsignados = rows.length;
  const conCarta = rows.filter((r) => r.origen === "CARTA").length;
  const promedioDias = rows.length
    ? Math.round(rows.reduce((acc, r) => acc + (r.diasAsignado ?? 0), 0) / rows.length)
    : 0;
  const deptos = new Set(rows.map((r) => r.departamento).filter(Boolean)).size;

  const origenLabel = (origen: AsignadoRow["origen"]) =>
    origen === "CARTA" ? tt("asignados.origenCarta") : origen === "MOVIMIENTO" ? tt("asignados.origenMovimiento") : tt("asignados.origenDesconocido");

  const summary: Array<{ label: string; value: number; color: string }> = [
    { label: tt("pdf.summaryAsignados"), value: totalAsignados, color: PDF_COLORS.band },
    { label: tt("pdf.summaryCarta"), value: conCarta, color: PDF_COLORS.success },
    { label: tt("pdf.summaryPromedio"), value: promedioDias, color: PDF_COLORS.danger },
    { label: tt("pdf.summaryDepartamentos"), value: deptos, color: PDF_COLORS.bandAccent },
  ];

  const ROWS_PER_PAGE = 24;
  const pages: AsignadoRow[][] = [];
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

            <View style={pdfTheme.tableHeader} fixed>
              <View style={{ width: COL.activo }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colActivo")}</Text></View>
              <View style={{ width: COL.desc }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colDescripcion")}</Text></View>
              <View style={{ width: COL.resp }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colResponsable")}</Text></View>
              <View style={{ width: COL.depto }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colDepartamento")}</Text></View>
              <View style={{ width: COL.folio }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colFolio")}</Text></View>
              <View style={{ width: COL.fecha }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colFecha")}</Text></View>
              <View style={{ width: COL.dias }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colDias")}</Text></View>
              <View style={{ width: COL.origen }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colOrigen")}</Text></View>
            </View>

            {pageRows.map((r, i) => (
              <View key={r.deviceId + i} style={i % 2 === 0 ? pdfTheme.tableRow : pdfTheme.tableRowAlt}>
                <View style={{ width: COL.activo }}><Text style={pdfTheme.cellBold}>{r.controlActivos}</Text></View>
                <View style={{ width: COL.desc }}>
                  <Text style={pdfTheme.cellDescTitle}>{r.descripcion}</Text>
                  <Text style={pdfTheme.cellDescSub}>{r.tipo} · {r.marca} {r.modelo}</Text>
                </View>
                <View style={{ width: COL.resp }}><Text style={pdfTheme.cell}>{r.responsable}</Text></View>
                <View style={{ width: COL.depto }}><Text style={pdfTheme.cellMuted}>{r.departamento ?? "—"}</Text></View>
                <View style={{ width: COL.folio }}><Text style={pdfTheme.cellMuted}>{r.folio ?? "—"}</Text></View>
                <View style={{ width: COL.fecha }}><Text style={pdfTheme.cellMuted}>{fmtDate(r.fecha)}</Text></View>
                <View style={{ width: COL.dias }}>
                  <Text style={(r.diasAsignado ?? 0) > 30 ? styles.diasAlerta : [pdfTheme.cell, styles.celdaNumero]}>
                    {r.diasAsignado ?? "—"}
                  </Text>
                </View>
                <View style={{ width: COL.origen }}>
                  <Text style={origenBadgeStyle(r.origen)}>{origenLabel(r.origen)}</Text>
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
