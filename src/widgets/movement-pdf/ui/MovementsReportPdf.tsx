import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { useTranslation } from "react-i18next";
import type { Movement } from "@entities/inventory";
import { PDF_COLORS, pdfTheme, badgeStyleFor } from "@shared/pdf/theme";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import PdfFooter from "@shared/pdf/PdfFooter";
import { TYPE_BADGE_COLOR } from "@entities/inventory/model/movementColors";
import { formatDate } from "@shared/utils/dates";
import { dateLocale } from "@shared/i18n";

interface Props {
  movements: Movement[];
}

const styles = StyleSheet.create({
  colDate: { width: 50 },
  colFolio: { width: 62 },
  colType: { width: 90 },
  colItem: { flex: 1 },
  colQty: { width: 32 },
  colResp: { width: 92 },
  colStatus: { width: 52 },
});

const typeBadgeKind = (type: string) => {
  const kind = TYPE_BADGE_COLOR[type as keyof typeof TYPE_BADGE_COLOR];
  return badgeStyleFor(kind === "info" ? "gray" : (kind as "success" | "warning" | "danger" | "gray"));
};

export default function MovementsReportPdf({ movements }: Props) {
  const { t } = useTranslation(["inventory"]);
  const doc = t("movements.reportDoc", { returnObjects: true }) as Record<string, string>;
  const today = new Date().toLocaleDateString(dateLocale());

  const totals = movements.length;
  const entries = movements.filter((m) => ["STOCK_IN", "ADJUSTMENT_IN", "RETURN"].includes(m.type)).length;
  const exits = movements.filter((m) => ["RETIREMENT", "ADJUSTMENT_OUT"].includes(m.type)).length;
  const pieces = movements.reduce((acc, m) => acc + m.items.reduce((s, d) => s + d.quantity, 0), 0);

  const summary = [
    { label: doc.total, value: totals, color: PDF_COLORS.band },
    { label: doc.entries, value: entries, color: PDF_COLORS.success },
    { label: doc.exits, value: exits, color: PDF_COLORS.danger },
    { label: doc.pieces, value: pieces, color: PDF_COLORS.bandAccent },
  ];

  const ROWS_PER_PAGE = 24;
  const pages: Movement[][] = [];
  for (let i = 0; i < movements.length; i += ROWS_PER_PAGE) {
    pages.push(movements.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  return (
    <Document title={doc.title} author="Puerto Nuevo Hotel y Villas">
      {pages.map((pageRows, pageIdx) => (
        <Page key={pageIdx} size="LETTER" style={pdfTheme.page}>
          <PdfLetterhead title={doc.title} pageIndex={pageIdx} pageCount={pages.length} generatedAt={today} />

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
              <View style={styles.colDate}><Text style={pdfTheme.tableHeaderText}>{doc.c_date}</Text></View>
              <View style={styles.colFolio}><Text style={pdfTheme.tableHeaderText}>{doc.c_folio}</Text></View>
              <View style={styles.colType}><Text style={pdfTheme.tableHeaderText}>{doc.c_type}</Text></View>
              <View style={styles.colItem}><Text style={pdfTheme.tableHeaderText}>{doc.c_item}</Text></View>
              <View style={styles.colQty}><Text style={[pdfTheme.tableHeaderText, { textAlign: "center" }]}>{doc.c_qty}</Text></View>
              <View style={styles.colResp}><Text style={pdfTheme.tableHeaderText}>{doc.c_resp}</Text></View>
              <View style={styles.colStatus}><Text style={pdfTheme.tableHeaderText}>{doc.c_status}</Text></View>
            </View>

            {pageRows.map((m, i) => (
              <View key={m.id} style={i % 2 === 0 ? pdfTheme.tableRow : pdfTheme.tableRowAlt}>
                <View style={styles.colDate}><Text style={pdfTheme.cellMuted}>{formatDate(m.date)}</Text></View>
                <View style={styles.colFolio}><Text style={pdfTheme.cellBold}>{`MV-${m.id.slice(0, 8).toUpperCase()}`}</Text></View>
                <View style={styles.colType}><Text style={typeBadgeKind(m.type)}>{t(`typeLabels.${m.type}`)}</Text></View>
                <View style={styles.colItem}>
                  <Text style={pdfTheme.cellDescTitle}>
                    {m.items.map((d) => `${d.device?.name ?? "—"} x${d.quantity}`).join(", ")}
                  </Text>
                </View>
                <View style={styles.colQty}><Text style={[pdfTheme.cellBold, { textAlign: "center" }]}>{m.items.reduce((s, d) => s + d.quantity, 0)}</Text></View>
                <View style={styles.colResp}><Text style={pdfTheme.cell}>{m.custodian?.name ?? m.createdBy?.name ?? "—"}</Text></View>
                <View style={styles.colStatus}>
                  <Text style={m.status === "CANCELLED" ? badgeStyleFor("danger") : badgeStyleFor("success")}>
                    {m.status === "CANCELLED" ? doc.d_cancelled : doc.d_active}
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