import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReportDoc } from "@shared/lib/reportDoc";
import { PDF_COLORS, pdfTheme } from "@shared/pdf/theme";
import { i18n } from "@shared/i18n";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import PdfFooter from "@shared/pdf/PdfFooter";

interface Props {
  doc: ReportDoc;
  generatedAt: string;
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 9,
    color: PDF_COLORS.muted,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.band,
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  headerCell: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.border,
  },
  rowAlt: { backgroundColor: PDF_COLORS.light },
  cell: { fontSize: 7.6, color: PDF_COLORS.ink, paddingRight: 4 },
  empty: { fontSize: 8, color: PDF_COLORS.muted, paddingVertical: 10 },
});

/** Ancho de cada columna: reparto igual, la primera se lleva el doble. */
const columnWidth = (index: number, total: number): string => {
  if (index === 0) return `${Math.min(46, (total + 1) * 4)}%`;
  const rest = 100 - (total > 1 ? Math.min(46, (total + 1) * 4) : 0);
  return `${rest / Math.max(1, total - 1)}%`;
};

const alignOf = (align: "left" | "center" | "right" | undefined): "flex-start" | "center" | "flex-end" =>
  align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start";

/**
 * Reporte tabular genérico de RH (pre-nómina, asistencia, faltas, tiempo extra,
 * plantilla): una tabla limpia con el membrete del sistema. Se genera desde el
 * mismo `ReportDoc` que el CSV para que ambos exports coincidan.
 */
export default function HrReportPdf({ doc, generatedAt }: Props) {
  const total = Math.max(1, doc.columns.length);
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={pdfTheme.page}>
        <PdfLetterhead title={doc.title} generatedAt={generatedAt} />
        <View style={pdfTheme.content}>
          {doc.subtitle && <Text style={styles.subtitle}>{doc.subtitle}</Text>}
          <View style={styles.headerRow}>
            {doc.columns.map((column, index) => (
              <View
                key={column.key}
                style={{ width: columnWidth(index, total), alignItems: alignOf(column.align) }}
              >
                <Text style={styles.headerCell}>{column.label}</Text>
              </View>
            ))}
          </View>
          {doc.rows.length === 0 ? (
            <Text style={styles.empty}>{i18n.t("common:pdf.noData")}</Text>
          ) : (
            doc.rows.map((row, rowIndex) => (
              <View
                key={rowIndex}
                style={rowIndex % 2 === 1 ? [styles.row, styles.rowAlt] : styles.row}
                wrap={false}
              >
                {doc.columns.map((column, index) => (
                  <View
                    key={column.key}
                    style={{ width: columnWidth(index, total), alignItems: alignOf(column.align) }}
                  >
                    <Text style={styles.cell}>{row[column.key] ?? "—"}</Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
        <PdfFooter />
      </Page>
    </Document>
  );
}
