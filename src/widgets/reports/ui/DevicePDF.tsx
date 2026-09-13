import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { useTranslation } from "react-i18next";
import type { DeviceReportRow } from "@entities/report";
import { PDF_COLORS, pdfTheme, badgeStyleFor } from "@shared/pdf/theme";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import PdfFooter from "@shared/pdf/PdfFooter";

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

export default function DevicePDF({ rows, title }: Props) {
  const { t: tt } = useTranslation(["reports"]);
  const reportTitle = title ?? tt("pdf.devicesTitle");
  const today = fmtDate(new Date().toISOString());
  const disponibles = rows.filter((r) => r.estado === "DISPONIBLE").length;
  const asignados = rows.filter((r) => r.estado === "ASIGNADO").length;
  const bajas = rows.filter((r) => r.estado === "BAJA").length;
  const masDe30 = rows.filter((r) => (r.diasAsignado ?? 0) > 30).length;

  const estadoLabel = (estado: string) =>
    estado === "ASIGNADO" ? tt("pdf.estadoAsignado") : estado === "DISPONIBLE" ? tt("pdf.estadoDisponible") : tt("pdf.estadoBaja");

  const summary: Array<{ label: string; value: number; color: string }> = [
    { label: tt("devices.statDispositivos"), value: rows.length, color: PDF_COLORS.band },
    { label: tt("pdf.summaryDisponibles"), value: disponibles, color: PDF_COLORS.success },
    { label: tt("pdf.summaryAsignados"), value: asignados, color: PDF_COLORS.warning },
    { label: tt("pdf.mas30"), value: masDe30, color: PDF_COLORS.danger },
    { label: tt("pdf.summaryBaja"), value: bajas, color: PDF_COLORS.gray },
  ];

  const ROWS_PER_PAGE = 26;
  const pages: DeviceReportRow[][] = [];
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
              <View style={{ width: COL.activo }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colActivo")}</Text></View>
              <View style={{ width: COL.desc }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colDescripcion")}</Text></View>
              <View style={{ width: COL.cant }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colCant")}</Text></View>
              <View style={{ width: COL.estado }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colEstado")}</Text></View>
              <View style={{ width: COL.resp }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colResponsable")}</Text></View>
              <View style={{ width: COL.depto }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colDepto")}</Text></View>
              <View style={{ width: COL.dias }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colDias")}</Text></View>
              <View style={{ width: COL.folio }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colFolio")}</Text></View>
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
                  <Text style={r.estado === "ASIGNADO" && (r.diasAsignado ?? 0) > 30 ? styles.diasAlerta : pdfTheme.cell}>
                    {r.estado === "ASIGNADO" ? r.diasAsignado ?? "—" : "—"}
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
