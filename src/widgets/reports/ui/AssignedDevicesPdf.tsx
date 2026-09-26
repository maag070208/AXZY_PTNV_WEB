import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { useTranslation } from "react-i18next";
import type { AssignedDeviceRow } from "@entities/report";
import { PDF_COLORS, pdfTheme, badgeStyleFor } from "@shared/pdf/theme";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import PdfFooter from "@shared/pdf/PdfFooter";

interface Props {
  rows: AssignedDeviceRow[];
  title?: string;
  /** El universo filtrado no cupo: se marca en el pie. */
  truncated?: boolean;
  /** Filtros de columna que el servidor aplicó (etiqueta ya traducida). */
  appliedFilters?: Array<{ label: string; value: string }>;
}

const styles = StyleSheet.create({
  daysAlert: { fontSize: 7.8, fontFamily: "Helvetica-Bold", color: PDF_COLORS.danger, textAlign: "right" },
  cellNumber: { textAlign: "right" },
  truncationNote: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.warning,
    marginBottom: 3,
  },
});

const fmtDate = (d: string | null): string => {
  if (!d) return "—";
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = date.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

const sourceBadgeStyle = (source: AssignedDeviceRow["source"]) =>
  source === "CUSTODY_LETTER" ? badgeStyleFor("success") : source === "MOVEMENT" ? badgeStyleFor("warning") : badgeStyleFor("gray");

// Anchos en puntos; suman ~526 (folio LETTER − padding horizontal de 36×2),
// igual que DevicePDF para que ambos reportes se lean igual.
const COL = {
  active: 68,
  desc: 114,
  resp: 94,
  dept: 72,
  folio: 50,
  date: 50,
  days: 36,
  source: 42,
};

export default function AssignedDevicesPdf({ rows, title, truncated, appliedFilters }: Props) {
  const { t: tt } = useTranslation(["reports"]);
  const reportTitle = title ?? tt("pdf.assignedTitle");
  const today = fmtDate(new Date().toISOString());
  const totalAssigned = rows.length;
  const withCustodyLetter = rows.filter((r) => r.source === "CUSTODY_LETTER").length;
  const averageDays = rows.length
    ? Math.round(rows.reduce((acc, r) => acc + (r.daysAssigned ?? 0), 0) / rows.length)
    : 0;
  const depts = new Set(rows.map((r) => r.department).filter(Boolean)).size;

  const sourceLabel = (source: AssignedDeviceRow["source"]) =>
    source === "CUSTODY_LETTER" ? tt("assigned.sourceCustodyLetter") : source === "MOVEMENT" ? tt("assigned.sourceMovement") : tt("assigned.unknownSource");

  const summary: Array<{ label: string; value: number; color: string }> = [
    { label: tt("pdf.summaryAssigned"), value: totalAssigned, color: PDF_COLORS.band },
    { label: tt("pdf.summaryCustodyLetter"), value: withCustodyLetter, color: PDF_COLORS.success },
    { label: tt("pdf.summaryAverage"), value: averageDays, color: PDF_COLORS.danger },
    { label: tt("pdf.summaryDepartments"), value: depts, color: PDF_COLORS.bandAccent },
  ];

  const ROWS_PER_PAGE = 24;
  const pages: AssignedDeviceRow[][] = [];
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
              <View style={{ width: COL.active }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.activeCol")}</Text></View>
              <View style={{ width: COL.desc }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colDescription")}</Text></View>
              <View style={{ width: COL.resp }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colCustodian")}</Text></View>
              <View style={{ width: COL.dept }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colDepartment")}</Text></View>
              <View style={{ width: COL.folio }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colFolio")}</Text></View>
              <View style={{ width: COL.date }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colDate")}</Text></View>
              <View style={{ width: COL.days }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colDays")}</Text></View>
              <View style={{ width: COL.source }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colSource")}</Text></View>
            </View>

            {pageRows.map((r, i) => (
              <View key={r.deviceId + i} style={i % 2 === 0 ? pdfTheme.tableRow : pdfTheme.tableRowAlt}>
                <View style={{ width: COL.active }}><Text style={pdfTheme.cellBold}>{r.assetTag}</Text></View>
                <View style={{ width: COL.desc }}>
                  <Text style={pdfTheme.cellDescTitle}>{r.description}</Text>
                  <Text style={pdfTheme.cellDescSub}>{r.type} · {r.brand} {r.model}</Text>
                </View>
                <View style={{ width: COL.resp }}><Text style={pdfTheme.cell}>{r.custodian}</Text></View>
                <View style={{ width: COL.dept }}><Text style={pdfTheme.cellMuted}>{r.department ?? "—"}</Text></View>
                <View style={{ width: COL.folio }}><Text style={pdfTheme.cellMuted}>{r.folio ?? "—"}</Text></View>
                <View style={{ width: COL.date }}><Text style={pdfTheme.cellMuted}>{fmtDate(r.date)}</Text></View>
                <View style={{ width: COL.days }}>
                  <Text style={(r.daysAssigned ?? 0) > 30 ? styles.daysAlert : [pdfTheme.cell, styles.cellNumber]}>
                    {r.daysAssigned ?? "—"}
                  </Text>
                </View>
                <View style={{ width: COL.source }}>
                  <Text style={sourceBadgeStyle(r.source)}>{sourceLabel(r.source)}</Text>
                </View>
              </View>
            ))}

            {pageIdx === pages.length - 1 && (truncated || (appliedFilters?.length ?? 0) > 0) && (
              <View style={pdfTheme.filterBox} wrap={false}>
                <Text style={pdfTheme.filterTitle}>{tt("pdf.appliedFilters")}</Text>
                {truncated && (
                  <Text style={styles.truncationNote}>
                    {tt("pdf.truncatedRows", { shown: rows.length })}
                  </Text>
                )}
                {appliedFilters!.map((f) => (
                  <Text key={f.label} style={pdfTheme.filterText}>
                    {f.label}: {f.value}
                  </Text>
                ))}
              </View>
            )}
          </View>

          <PdfFooter pageIndex={pageIdx} pageCount={pages.length} />
        </Page>
      ))}
    </Document>
  );
}
