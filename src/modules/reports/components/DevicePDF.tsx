import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { DeviceReportRow } from "@core/api/reports.api";
import { PDF_COLORS, pdfTheme, badgeStyleFor } from "@core/pdf/theme";
import PdfLetterhead from "@core/pdf/PdfLetterhead";
import PdfFooter from "@core/pdf/PdfFooter";

interface Props {
  rows: DeviceReportRow[];
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

const estadoBadge = (estado: string) =>
  estado === "DISPONIBLE" ? badgeStyleFor("success") : estado === "ASIGNADO" ? badgeStyleFor("warning") : badgeStyleFor("gray");

const estadoLabel = (estado: string) =>
  estado === "ASIGNADO" ? "Asignado" : estado === "DISPONIBLE" ? "Disponible" : "Baja";

const COL = {
  activo: 68,
  desc: 144,
  cant: 28,
  estado: 50,
  resp: 94,
  depto: 72,
  dias: 34,
  folio: 36,
};

export default function DevicePDF({ rows, title = "Reporte de Dispositivos" }: Props) {
  const today = fmtDate(new Date().toISOString());
  const disponibles = rows.filter((r) => r.estado === "DISPONIBLE").length;
  const prestados = rows.filter((r) => r.estado === "ASIGNADO").length;
  const bajas = rows.filter((r) => r.estado === "BAJA").length;
  const masDe30 = rows.filter((r) => (r.diasPrestado ?? 0) > 30).length;

  const summary: Array<{ label: string; value: number; color: string }> = [
    { label: "Dispositivos", value: rows.length, color: PDF_COLORS.band },
    { label: "Disponibles", value: disponibles, color: PDF_COLORS.success },
    { label: "Prestados", value: prestados, color: PDF_COLORS.warning },
    { label: "+30 días", value: masDe30, color: PDF_COLORS.danger },
    { label: "Baja", value: bajas, color: PDF_COLORS.gray },
  ];

  const ROWS_PER_PAGE = 26;
  const pages: DeviceReportRow[][] = [];
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
              <View style={{ width: COL.cant }}><Text style={pdfTheme.tableHeaderText}>Cant.</Text></View>
              <View style={{ width: COL.estado }}><Text style={pdfTheme.tableHeaderText}>Estado</Text></View>
              <View style={{ width: COL.resp }}><Text style={pdfTheme.tableHeaderText}>Responsable</Text></View>
              <View style={{ width: COL.depto }}><Text style={pdfTheme.tableHeaderText}>Depto.</Text></View>
              <View style={{ width: COL.dias }}><Text style={pdfTheme.tableHeaderText}>Días</Text></View>
              <View style={{ width: COL.folio }}><Text style={pdfTheme.tableHeaderText}>Folio</Text></View>
            </View>

            {pageRows.map((r, i) => (
              <View key={r.deviceId + i} style={i % 2 === 0 ? pdfTheme.tableRow : pdfTheme.tableRowAlt}>
                <View style={{ width: COL.activo }}><Text style={pdfTheme.cellBold}>{r.controlActivos}</Text></View>
                <View style={{ width: COL.desc }}>
                  <Text style={pdfTheme.cellDescTitle}>{r.descripcion}</Text>
                  <Text style={pdfTheme.cellDescSub}>{r.tipo} · {r.marca} {r.modelo}</Text>
                </View>
                <View style={{ width: COL.cant }}><Text style={pdfTheme.cell}>{r.cantidad}</Text></View>
                <View style={{ width: COL.estado }}>
                  <Text style={estadoBadge(r.estado)}>{estadoLabel(r.estado)}</Text>
                </View>
                <View style={{ width: COL.resp }}><Text style={pdfTheme.cell}>{r.estado === "ASIGNADO" ? r.responsable ?? "—" : "—"}</Text></View>
                <View style={{ width: COL.depto }}><Text style={pdfTheme.cellMuted}>{r.estado === "ASIGNADO" ? r.departamento ?? "—" : "—"}</Text></View>
                <View style={{ width: COL.dias }}>
                  <Text style={r.estado === "ASIGNADO" && (r.diasPrestado ?? 0) > 30 ? styles.diasAlerta : pdfTheme.cell}>
                    {r.estado === "ASIGNADO" ? r.diasPrestado ?? "—" : "—"}
                  </Text>
                </View>
                <View style={{ width: COL.folio }}><Text style={pdfTheme.cellMuted}>{r.estado === "ASIGNADO" ? r.folio ?? "—" : "—"}</Text></View>
              </View>
            ))}
          </View>

          <PdfFooter pageIndex={pageIdx} pageCount={pages.length} />
        </Page>
      ))}
    </Document>
  );
}
