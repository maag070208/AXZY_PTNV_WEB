import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PrestamoRow } from "@core/api/reports.api";
import { PDF_COLORS, pdfTheme, badgeStyleFor } from "@core/pdf/theme";
import PdfLetterhead from "@core/pdf/PdfLetterhead";
import PdfFooter from "@core/pdf/PdfFooter";

interface Props {
  rows: PrestamoRow[];
  title?: string;
}

const styles = StyleSheet.create({
  diasAlerta: { fontSize: 7.8, fontFamily: "Helvetica-Bold", color: PDF_COLORS.danger },
});

const fmtDate = (d: string | null): string => {
  if (!d) return "—";
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = date.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

const origenBadgeStyle = (origen: PrestamoRow["origen"]) =>
  origen === "CARTA" ? badgeStyleFor("success") : origen === "MOVIMIENTO" ? badgeStyleFor("warning") : badgeStyleFor("gray");

const origenLabel = (origen: PrestamoRow["origen"]) =>
  origen === "CARTA" ? "Carta" : origen === "MOVIMIENTO" ? "Movimiento" : "Desconocido";

const COL = {
  activo: 68,
  desc: 112,
  resp: 92,
  depto: 70,
  folio: 50,
  fecha: 48,
  dias: 36,
  origen: 42,
};

export default function PrestamoPDF({ rows, title = "Reporte de Préstamos Activos" }: Props) {
  const today = fmtDate(new Date().toISOString());
  const totalPrestamos = rows.length;
  const conCarta = rows.filter((r) => r.origen === "CARTA").length;
  const promedioDias = rows.length
    ? Math.round(rows.reduce((acc, r) => acc + (r.diasPrestado ?? 0), 0) / rows.length)
    : 0;
  const deptos = new Set(rows.map((r) => r.departamento).filter(Boolean)).size;

  const summary: Array<{ label: string; value: number; color: string }> = [
    { label: "Préstamos activos", value: totalPrestamos, color: PDF_COLORS.band },
    { label: "Con carta responsiva", value: conCarta, color: PDF_COLORS.success },
    { label: "Días promedio", value: promedioDias, color: PDF_COLORS.danger },
    { label: "Departamentos", value: deptos, color: PDF_COLORS.bandAccent },
  ];

  const ROWS_PER_PAGE = 26;
  const pages: PrestamoRow[][] = [];
  for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
    pages.push(rows.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  return (
    <Document title={title} author="Puerto Nuevo Hotel y Villas">
      {pages.map((pageRows, pageIdx) => (
        <Page key={pageIdx} size="LETTER" style={pdfTheme.page}>
          <PdfLetterhead title={title} pageIndex={pageIdx} pageCount={pages.length} generatedAt={today} />

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
              <View style={{ width: COL.activo }}><Text style={pdfTheme.tableHeaderText}>Activo</Text></View>
              <View style={{ width: COL.desc }}><Text style={pdfTheme.tableHeaderText}>Descripción</Text></View>
              <View style={{ width: COL.resp }}><Text style={pdfTheme.tableHeaderText}>Responsable</Text></View>
              <View style={{ width: COL.depto }}><Text style={pdfTheme.tableHeaderText}>Departamento</Text></View>
              <View style={{ width: COL.folio }}><Text style={pdfTheme.tableHeaderText}>Folio</Text></View>
              <View style={{ width: COL.fecha }}><Text style={pdfTheme.tableHeaderText}>Fecha</Text></View>
              <View style={{ width: COL.dias }}><Text style={pdfTheme.tableHeaderText}>Días</Text></View>
              <View style={{ width: COL.origen }}><Text style={pdfTheme.tableHeaderText}>Origen</Text></View>
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
                  <Text style={(r.diasPrestado ?? 0) > 30 ? styles.diasAlerta : pdfTheme.cell}>
                    {r.diasPrestado ?? "—"}
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
