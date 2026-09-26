import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { useTranslation } from "react-i18next";
import type { MaterialOutput } from "@entities/material-output";
import { PDF_COLORS, pdfTheme, badgeStyleFor } from "@shared/pdf/theme";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import PdfFooter from "@shared/pdf/PdfFooter";

interface Props {
  rows: MaterialOutput[];
  title?: string;
  /** Filtros aplicados que el servidor recortó (etiqueta ya traducida). */
  appliedFilters?: Array<{ label: string; value: string }>;
}

const fmtDate = (d: string | null): string => {
  if (!d) return "—";
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = date.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

const reasonBadge = (reason: MaterialOutput["reason"]) =>
  reason === "DAMAGED" || reason === "LOST"
    ? badgeStyleFor("danger")
    : reason === "OBSOLETE"
    ? badgeStyleFor("warning")
    : badgeStyleFor("gray");

const styles = StyleSheet.create({
  emptyBadge: { fontSize: 7.5, color: PDF_COLORS.muted },
});

const COL = {
  date: 46,
  desc: 132,
  qty: 26,
  dept: 78,
  userName: 78,
  reason: 56,
  device: 66,
};

export default function MaterialOutputsPdf({ rows, title, appliedFilters }: Props) {
  const { t: tt } = useTranslation(["reports", "material-outputs"]);
  const reportTitle = title ?? tt("pdf.exitsTitle");
  const today = fmtDate(new Date().toISOString());
  const damaged = rows.filter((r) => r.reason === "DAMAGED").length;
  const withDevice = rows.filter((r) => r.deviceId).length;

  const reasonLabel = (reason: MaterialOutput["reason"]) =>
    reason ? tt(`material-outputs:reason.${reason}`) : "—";

  const summary: Array<{ label: string; value: number; color: string }> = [
    { label: tt("exits.statTotal"), value: rows.length, color: PDF_COLORS.band },
    { label: tt("pdf.damagedSummary"), value: damaged, color: PDF_COLORS.danger },
    { label: tt("pdf.summaryWithDevice"), value: withDevice, color: PDF_COLORS.warning },
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
              <View style={{ width: COL.date }}><Text style={pdfTheme.tableHeaderText}>{tt("exits.colDate")}</Text></View>
              <View style={{ width: COL.desc }}><Text style={pdfTheme.tableHeaderText}>{tt("exits.colDescription")}</Text></View>
              <View style={{ width: COL.qty }}><Text style={pdfTheme.tableHeaderText}>{tt("exits.colQty")}</Text></View>
              <View style={{ width: COL.dept }}><Text style={pdfTheme.tableHeaderText}>{tt("exits.colDept")}</Text></View>
              <View style={{ width: COL.userName }}><Text style={pdfTheme.tableHeaderText}>{tt("exits.colUser")}</Text></View>
              <View style={{ width: COL.reason }}><Text style={pdfTheme.tableHeaderText}>{tt("exits.colReason")}</Text></View>
              <View style={{ width: COL.device }}><Text style={pdfTheme.tableHeaderText}>{tt("exits.colDevice")}</Text></View>
            </View>

            {pageRows.map((r, i) => (
              <View key={r.id + i} style={i % 2 === 0 ? pdfTheme.tableRow : pdfTheme.tableRowAlt}>
                <View style={{ width: COL.date }}><Text style={pdfTheme.cell}>{fmtDate(r.date)}</Text></View>
                <View style={{ width: COL.desc }}>
                  <Text style={pdfTheme.cellDescTitle}>{r.description}</Text>
                  {(r.brand || r.model) && (
                    <Text style={pdfTheme.cellDescSub}>{[r.brand, r.model].filter(Boolean).join(" · ")}</Text>
                  )}
                </View>
                <View style={{ width: COL.qty }}><Text style={pdfTheme.cell}>{r.quantity}</Text></View>
                <View style={{ width: COL.dept }}><Text style={pdfTheme.cellMuted}>{r.departmentName}</Text></View>
                <View style={{ width: COL.userName }}><Text style={pdfTheme.cell}>{r.userName}</Text></View>
                <View style={{ width: COL.reason }}>
                  {r.reason ? (
                    <Text style={reasonBadge(r.reason)}>{reasonLabel(r.reason)}</Text>
                  ) : (
                    <Text style={styles.emptyBadge}>—</Text>
                  )}
                </View>
                <View style={{ width: COL.device }}><Text style={pdfTheme.cellMuted}>{r.device?.assetTag ?? "—"}</Text></View>
              </View>
            ))}

            {pageIdx === pages.length - 1 && (appliedFilters?.length ?? 0) > 0 && (
              <View style={pdfTheme.filterBox} wrap={false}>
                <Text style={pdfTheme.filterTitle}>{tt("pdf.appliedFilters")}</Text>
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
