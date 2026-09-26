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
  daysAlert: {
    fontSize: 7.8,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.danger,
    textAlign: "right",
  },
  cellNumber: { textAlign: "right" },
});

const fmtDate = (d: string | null): string => {
  if (!d) return "—";
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = date.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

const statusBadge = (status: string) =>
  status === "AVAILABLE" ? badgeStyleFor("success") : status === "ASSIGNED" ? badgeStyleFor("warning") : badgeStyleFor("gray");

// Anchos en puntos; suman ~526 (folio LETTER − padding horizontal de 36×2).
// Responsable es la columna de texto más ancha; Folio y Días quedan compactos.
const COL = {
  active: 60,
  desc: 148,
  status: 48,
  resp: 118,
  dept: 82,
  folio: 46,
  days: 24,
};

export default function DevicePDF({ rows, title }: Props) {
  const { t: tt } = useTranslation(["reports"]);
  const reportTitle = title ?? tt("pdf.devicesTitle");
  const today = fmtDate(new Date().toISOString());
  const available = rows.filter((r) => r.status === "AVAILABLE").length;
  const assigned = rows.filter((r) => r.status === "ASSIGNED").length;
  const retirements = rows.filter((r) => r.status === "RETIRED").length;
  const moreDe30 = rows.filter((r) => (r.daysAssigned ?? 0) > 30).length;

  const statusLabel = (status: string) =>
    status === "ASSIGNED" ? tt("pdf.assignedStatus") : status === "AVAILABLE" ? tt("pdf.availableStatus") : tt("pdf.retirementStatus");

  const summary: Array<{ label: string; value: number; color: string }> = [
    { label: tt("devices.statDevices"), value: rows.length, color: PDF_COLORS.band },
    { label: tt("pdf.availableSummary"), value: available, color: PDF_COLORS.success },
    { label: tt("pdf.summaryAssigned"), value: assigned, color: PDF_COLORS.warning },
    { label: tt("pdf.over30"), value: moreDe30, color: PDF_COLORS.danger },
    { label: tt("pdf.summaryRetirement"), value: retirements, color: PDF_COLORS.gray },
  ];

  const ROWS_PER_PAGE = 24;
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

            <View style={pdfTheme.tableHeader} fixed>
              <View style={{ width: COL.active }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.activeCol")}</Text></View>
              <View style={{ width: COL.desc }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colDescription")}</Text></View>
              <View style={{ width: COL.status }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colStatus")}</Text></View>
              <View style={{ width: COL.resp }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colCustodian")}</Text></View>
              <View style={{ width: COL.dept }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colDept")}</Text></View>
              <View style={{ width: COL.folio }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colFolio")}</Text></View>
              <View style={{ width: COL.days }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colDays")}</Text></View>
            </View>

            {pageRows.map((r, i) => (
              <View key={r.deviceId + i} style={i % 2 === 0 ? pdfTheme.tableRow : pdfTheme.tableRowAlt}>
                <View style={{ width: COL.active }}><Text style={pdfTheme.cellBold}>{r.assetTag}</Text></View>
                <View style={{ width: COL.desc }}>
                  <Text style={pdfTheme.cellDescTitle}>{r.description}</Text>
                  <Text style={pdfTheme.cellDescSub}>{r.type} · {r.brand} {r.model}</Text>
                </View>
                <View style={{ width: COL.status }}>
                  <Text style={statusBadge(r.status)}>{statusLabel(r.status)}</Text>
                </View>
                <View style={{ width: COL.resp }}>
                  {r.status === "ASSIGNED" ? (
                    <>
                      <Text style={pdfTheme.cell}>{r.custodian ?? "—"}</Text>
                      {r.employeeNumber && (
                        <Text style={pdfTheme.cellDescSub}>No. {r.employeeNumber}</Text>
                      )}
                    </>
                  ) : (
                    <Text style={pdfTheme.cell}>—</Text>
                  )}
                </View>
                <View style={{ width: COL.dept }}><Text style={pdfTheme.cellMuted}>{r.status === "ASSIGNED" ? r.department ?? "—" : "—"}</Text></View>
                <View style={{ width: COL.folio }}>
                  <Text style={[pdfTheme.cellMuted, styles.cellNumber]}>{r.status === "ASSIGNED" ? r.folio ?? "—" : "—"}</Text>
                </View>
                <View style={{ width: COL.days }}>
                  <Text style={r.status === "ASSIGNED" && (r.daysAssigned ?? 0) > 30 ? styles.daysAlert : [pdfTheme.cell, styles.cellNumber]}>
                    {r.status === "ASSIGNED" ? r.daysAssigned ?? "—" : "—"}
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