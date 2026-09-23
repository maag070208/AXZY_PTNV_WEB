import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { useTranslation } from "react-i18next";
import type {
  AccessIncidentCode,
  AccessReportPdfMeta,
  AccessReportPersonRow,
  AccessReportSummary,
} from "@entities/access";
import { PDF_COLORS, pdfTheme, badgeStyleFor } from "@shared/pdf/theme";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import PdfFooter from "@shared/pdf/PdfFooter";

interface Props {
  rows: AccessReportPersonRow[];
  summary: AccessReportSummary;
  meta: AccessReportPdfMeta;
  title?: string;
}

type BadgeKind = "success" | "warning" | "danger" | "gray" | "info";

const INCIDENT_COLOR: Record<AccessIncidentCode, BadgeKind> = {
  OPEN_ENTRY: "info",
  ENTRY_WITHOUT_EXIT: "warning",
  EXIT_WITHOUT_ENTRY: "danger",
};

const styles = StyleSheet.create({
  badgeRow: { flexDirection: "row", flexWrap: "wrap" },
  badgeGap: { marginRight: 2, marginBottom: 2 },
  totals: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: PDF_COLORS.light,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  totalsText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: PDF_COLORS.ink },
});

// Anchos en puntos; suman ~526 (folio LETTER − padding horizontal de 36×2).
const COL = {
  employee: 118,
  department: 70,
  status: 58,
  entry: 62,
  exit: 62,
  hours: 40,
  sessions: 34,
  days: 30,
  incidents: 52,
};

const fmtMinutes = (minutes: number): string => {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const timeOf = (iso: string): string => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const fmtStamp = (iso: string | null, period: string): string => {
  if (!iso) return "—";
  if (period === "DAY") return timeOf(iso);
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm} ${timeOf(iso)}`;
};

const fmtDateTime = (iso: string): string => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy} ${timeOf(iso)}`;
};

export default function AccessReportPDF({ rows, summary, meta, title }: Props) {
  const { t: tt } = useTranslation(["access-report"]);
  const reportTitle = title ?? tt("pdf.title");
  const today = fmtDateTime(new Date().toISOString());

  const statusOf = (row: AccessReportPersonRow): { kind: BadgeKind; label: string } => {
    if (!row.hasRecords) return { kind: "gray", label: tt("status.noRecords") };
    if (row.incidents.includes("OPEN_ENTRY")) return { kind: "info", label: tt("status.inside") };
    return { kind: "success", label: tt("status.hasRecords") };
  };

  const cards: Array<{ label: string; value: string | number; color: string }> = [
    { label: tt("kpis.withRecords"), value: summary.peopleWithRecords, color: PDF_COLORS.success },
    { label: tt("kpis.withoutRecords"), value: summary.peopleWithoutRecords, color: PDF_COLORS.gray },
    { label: tt("kpis.inside"), value: summary.peopleInside, color: PDF_COLORS.bandAccent },
    { label: tt("kpis.workedHours"), value: fmtMinutes(summary.totalWorkedMinutes), color: PDF_COLORS.band },
    { label: tt("kpis.incidents"), value: summary.totalIncidents, color: PDF_COLORS.warning },
  ];

  const ROWS_PER_PAGE = 20;
  const pages: AccessReportPersonRow[][] = [];
  for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
    pages.push(rows.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const renderIncidents = (incidents: AccessIncidentCode[]) => {
    if (incidents.length === 0) return <Text style={pdfTheme.cellMuted}>—</Text>;
    return (
      <View style={styles.badgeRow}>
        {incidents.map((code) => (
          <Text key={code} style={[badgeStyleFor(INCIDENT_COLOR[code]), styles.badgeGap]}>
            {tt(`incidents.${code}`)}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <Document title={reportTitle} author="Puerto Nuevo Hotel y Villas">
      {pages.map((pageRows, pageIdx) => (
        <Page key={pageIdx} size="LETTER" style={pdfTheme.page}>
          <PdfLetterhead
            title={reportTitle}
            pageIndex={pageIdx}
            pageCount={pages.length}
            generatedAt={today}
          />

          <View style={pdfTheme.content}>
            {pageIdx === 0 && (
              <>
                <View style={pdfTheme.summaryRow}>
                  {cards.map((c) => (
                    <View key={c.label} style={[pdfTheme.summaryCard, { borderTopColor: c.color }]}>
                      <Text style={[pdfTheme.summaryValue, { color: c.color }]}>{c.value}</Text>
                      <Text style={pdfTheme.summaryLabel}>{c.label}</Text>
                    </View>
                  ))}
                </View>

                <View style={pdfTheme.filterBox}>
                  <Text style={pdfTheme.filterTitle}>{tt("pdf.rangeTitle")}</Text>
                  <Text style={pdfTheme.filterText}>
                    {tt(`periods.${meta.period}`)} · {fmtDateTime(summary.range.start)} —{" "}
                    {fmtDateTime(summary.range.end)}
                  </Text>
                  <Text style={pdfTheme.filterText}>
                    {tt("pdf.timezone")}: {summary.range.timezone}
                  </Text>
                </View>
              </>
            )}

            <View style={pdfTheme.tableHeader} fixed>
              <View style={{ width: COL.employee }}>
                <Text style={pdfTheme.tableHeaderText}>{tt("columns.employee")}</Text>
              </View>
              <View style={{ width: COL.department }}>
                <Text style={pdfTheme.tableHeaderText}>{tt("columns.department")}</Text>
              </View>
              <View style={{ width: COL.status }}>
                <Text style={pdfTheme.tableHeaderText}>{tt("columns.status")}</Text>
              </View>
              <View style={{ width: COL.entry }}>
                <Text style={pdfTheme.tableHeaderText}>{tt("columns.entry")}</Text>
              </View>
              <View style={{ width: COL.exit }}>
                <Text style={pdfTheme.tableHeaderText}>{tt("columns.exit")}</Text>
              </View>
              <View style={{ width: COL.hours }}>
                <Text style={pdfTheme.tableHeaderText}>{tt("columns.hours")}</Text>
              </View>
              <View style={{ width: COL.sessions }}>
                <Text style={pdfTheme.tableHeaderText}>{tt("columns.sessions")}</Text>
              </View>
              <View style={{ width: COL.days }}>
                <Text style={pdfTheme.tableHeaderText}>{tt("columns.days")}</Text>
              </View>
              <View style={{ width: COL.incidents }}>
                <Text style={pdfTheme.tableHeaderText}>{tt("columns.incidents")}</Text>
              </View>
            </View>

            {pageRows.map((r, i) => {
              const status = statusOf(r);
              return (
                <View key={r.employeeId + i} style={i % 2 === 0 ? pdfTheme.tableRow : pdfTheme.tableRowAlt}>
                  <View style={{ width: COL.employee }}>
                    <Text style={pdfTheme.cellDescTitle}>{r.employeeName}</Text>
                    <Text style={pdfTheme.cellDescSub}>
                      {r.numeroEmpleado ? `#${r.numeroEmpleado}` : "—"}
                      {!r.active ? ` · ${tt("status.inactive")}` : ""}
                    </Text>
                  </View>
                  <View style={{ width: COL.department }}>
                    <Text style={pdfTheme.cellMuted}>{r.departmentName ?? tt("noDepartment")}</Text>
                  </View>
                  <View style={{ width: COL.status }}>
                    <Text style={badgeStyleFor(status.kind)}>{status.label}</Text>
                  </View>
                  <View style={{ width: COL.entry }}>
                    <Text style={pdfTheme.cell}>{fmtStamp(r.firstEntryAt, meta.period)}</Text>
                  </View>
                  <View style={{ width: COL.exit }}>
                    <Text style={pdfTheme.cell}>{fmtStamp(r.lastExitAt, meta.period)}</Text>
                  </View>
                  <View style={{ width: COL.hours }}>
                    <Text style={pdfTheme.cellBold}>{fmtMinutes(r.workedMinutes)}</Text>
                  </View>
                  <View style={{ width: COL.sessions }}>
                    <Text style={pdfTheme.cell}>{r.sessionCount}</Text>
                  </View>
                  <View style={{ width: COL.days }}>
                    <Text style={pdfTheme.cell}>{r.daysWithRecords}</Text>
                  </View>
                  <View style={{ width: COL.incidents }}>{renderIncidents(r.incidents)}</View>
                </View>
              );
            })}

            {pageIdx === pages.length - 1 && (
              <View style={styles.totals}>
                <Text style={styles.totalsText}>
                  {tt("pdf.totalPeople")}: {summary.peopleTotal}
                </Text>
                <Text style={styles.totalsText}>
                  {tt("pdf.totalHours")}: {fmtMinutes(summary.totalWorkedMinutes)}
                </Text>
                <Text style={styles.totalsText}>
                  {tt("pdf.totalIncidents")}: {summary.totalIncidents}
                </Text>
              </View>
            )}
          </View>

          <PdfFooter pageIndex={pageIdx} pageCount={pages.length} />
        </Page>
      ))}
    </Document>
  );
}
