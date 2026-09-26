import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { useTranslation } from "react-i18next";
import type { ReportRow } from "@entities/report";
import { PDF_COLORS, pdfTheme, badgeStyleFor } from "@shared/pdf/theme";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import PdfFooter from "@shared/pdf/PdfFooter";

interface Props {
  rows: ReportRow[];
  title?: string;
  filters?: {
    start?: string;
    end?: string;
    department?: string;
    employee?: string;
  };
}

const styles = StyleSheet.create({
  badgeLost: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.danger,
    backgroundColor: PDF_COLORS.dangerBg,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    textAlign: "center",
  },
});

const fmtDate = (d: Date | string | null): string => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = date.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

const fmtFilterDate = (iso?: string): string => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const statusBadge = (status: string) =>
  status === "ASSIGNED"
    ? badgeStyleFor("success")
    : status === "RETURNED"
    ? badgeStyleFor("warning")
    : status === "LOST"
    ? styles.badgeLost
    : badgeStyleFor("gray");

const COL = {
  date: 52,
  folio: 60,
  active: 58,
  desc: 118,
  resp: 86,
  dept: 72,
  status: 54,
};

export default function ReportPDF({ rows, title, filters }: Props) {
  const { t: tt } = useTranslation(["reports"]);
  const reportTitle = title ?? tt("pdf.deliveredTitle");
  const today = fmtDate(new Date());

  const totalDeliveries = rows.length;
  const assigned = rows.filter((r) => r.status === "ASSIGNED").length;
  const returned = rows.filter((r) => r.status === "RETURNED").length;
  const depts = new Set(rows.map((r) => r.department)).size;

  const summary: Array<{ label: string; value: number; color: string }> = [
    { label: tt("pdf.summaryTotal"), value: totalDeliveries, color: PDF_COLORS.band },
    { label: tt("pdf.summaryAssigned"), value: assigned, color: PDF_COLORS.success },
    { label: tt("pdf.summaryReturned"), value: returned, color: PDF_COLORS.warning },
    { label: tt("pdf.summaryDepartments"), value: depts, color: PDF_COLORS.bandAccent },
  ];

  const hasFilters = filters && (filters.start || filters.end || filters.department || filters.employee);
  const filterParts: string[] = [];
  if (filters?.start || filters?.end) {
    const from = filters?.start ? fmtFilterDate(filters.start) : "…";
    const to = filters?.end ? fmtFilterDate(filters.end) : "…";
    filterParts.push(tt("pdf.filterPeriod", { from, to }));
  }
  if (filters?.department) filterParts.push(tt("pdf.filterDepartment", { name: filters.department }));
  if (filters?.employee) filterParts.push(tt("pdf.filterEmployee", { name: filters.employee }));

  const ROWS_PER_PAGE = 28;
  const pages: ReportRow[][] = [];
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

            {pageIdx === 0 && hasFilters && (
              <View style={pdfTheme.filterBox}>
                <Text style={pdfTheme.filterTitle}>{tt("pdf.appliedFilters")}</Text>
                <Text style={pdfTheme.filterText}>{filterParts.join("  ·  ")}</Text>
              </View>
            )}

            <View style={pdfTheme.tableHeader}>
              <View style={{ width: COL.date }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colDate")}</Text></View>
              <View style={{ width: COL.folio }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colFolio")}</Text></View>
              <View style={{ width: COL.active }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.activeCol")}</Text></View>
              <View style={{ width: COL.desc }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colDescription")}</Text></View>
              <View style={{ width: COL.resp }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colCustodian")}</Text></View>
              <View style={{ width: COL.dept }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colDepartment")}</Text></View>
              <View style={{ width: COL.status }}><Text style={pdfTheme.tableHeaderText}>{tt("pdf.colStatus")}</Text></View>
            </View>

            {pageRows.map((r, i) => (
              <View key={r.id + i} style={i % 2 === 0 ? pdfTheme.tableRow : pdfTheme.tableRowAlt}>
                <View style={{ width: COL.date }}><Text style={pdfTheme.cellMuted}>{fmtDate(r.date)}</Text></View>
                <View style={{ width: COL.folio }}><Text style={pdfTheme.cellBold}>{r.document_code}</Text></View>
                <View style={{ width: COL.active }}><Text style={pdfTheme.cellBold}>{r.asset_code}</Text></View>
                <View style={{ width: COL.desc }}>
                  <Text style={pdfTheme.cellDescTitle}>{r.description}</Text>
                  {r.brand || r.model ? (
                    <Text style={pdfTheme.cellDescSub}>{[r.brand, r.model].filter(Boolean).join(" · ")}</Text>
                  ) : null}
                </View>
                <View style={{ width: COL.resp }}><Text style={pdfTheme.cell}>{r.responsible}</Text></View>
                <View style={{ width: COL.dept }}><Text style={pdfTheme.cellMuted}>{r.department}</Text></View>
                <View style={{ width: COL.status }}>
                  <Text style={statusBadge(r.status)}>{r.status}</Text>
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
