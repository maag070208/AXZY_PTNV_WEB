import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { WRITEOFF_REASONS, type WeeklyWriteoffReport } from "@entities/hotel-linen";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import { PDF_COLORS, pdfTheme } from "@shared/pdf/theme";
import { i18n } from "@shared/i18n";
import { dyn } from "@shared/i18n/dyn";

const tr = dyn(i18n.t);
const t = (key: string) => tr(`hotel-linen-writeoff:${key}`);
const qty = (n: number) => (n ? n.toLocaleString("es-MX", { maximumFractionDigits: 2 }) : "—");
const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (iso: string) => new Date(iso).toLocaleDateString("es-MX");

const s = StyleSheet.create({
  period: { fontSize: 9, color: PDF_COLORS.muted, marginBottom: 10 },
  head: { flexDirection: "row", backgroundColor: PDF_COLORS.band, paddingVertical: 5, paddingHorizontal: 4 },
  headText: { color: PDF_COLORS.white, fontFamily: "Helvetica-Bold", fontSize: 8, textAlign: "right" },
  row: { flexDirection: "row", paddingVertical: 4, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: PDF_COLORS.border },
  totalRow: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 4, backgroundColor: PDF_COLORS.light },
  cItem: { flex: 4 },
  cReason: { flex: 1, textAlign: "right" },
  cTotal: { flex: 1.2, textAlign: "right" },
  cCost: { flex: 1.8, textAlign: "right" },
  bold: { fontFamily: "Helvetica-Bold" },
  legend: { marginTop: 10, fontSize: 7.5, color: PDF_COLORS.muted },
  signatures: { flexDirection: "row", gap: 40, marginTop: 44, paddingHorizontal: 20 },
  signature: { flex: 1, alignItems: "center" },
  signatureLine: { borderTopWidth: 1, borderTopColor: PDF_COLORS.ink, width: "100%", marginBottom: 4 },
  signatureLabel: { fontSize: 8, fontFamily: "Helvetica-Bold" },
});

/** Reporte semanal de bajas de blancos (formato pág. 15): artículo × motivo, total y costo. */
export default function WriteoffWeeklyPdf({ report }: { report: WeeklyWriteoffReport }) {
  return (
    <Document title={t("writeoffs.weekly.title")}>
      <Page size="LETTER" style={pdfTheme.page}>
        <PdfLetterhead title={t("writeoffs.weekly.title")} generatedAt={new Date().toLocaleString("es-MX")} />
        <View style={pdfTheme.content}>
          <Text style={s.period}>
            {t("writeoffs.weekly.period")}: {day(report.from)} – {day(report.to)} · {t("writeoffs.weekly.writeoffs")}: {report.writeoffs}
          </Text>
          <View style={s.head}>
            <Text style={[s.headText, s.cItem, { textAlign: "left" }]}>{t("writeoffs.weekly.item")}</Text>
            {WRITEOFF_REASONS.map((c) => (
              <Text key={c} style={[s.headText, s.cReason]}>{c}</Text>
            ))}
            <Text style={[s.headText, s.cTotal]}>{t("writeoffs.weekly.total")}</Text>
            <Text style={[s.headText, s.cCost]}>{t("writeoffs.weekly.cost")}</Text>
          </View>
          {report.rows.map((r) => (
            <View key={r.productId} style={s.row} wrap={false}>
              <Text style={s.cItem}>{r.size ? `${r.name} · ${r.size}` : r.name}</Text>
              {WRITEOFF_REASONS.map((c) => (
                <Text key={c} style={s.cReason}>{qty(r.byReason[c])}</Text>
              ))}
              <Text style={[s.cTotal, s.bold]}>{qty(r.total)}</Text>
              <Text style={s.cCost}>{money(r.cost)}</Text>
            </View>
          ))}
          <View style={s.totalRow}>
            <Text style={[s.cItem, s.bold]}>{t("writeoffs.weekly.totals")}</Text>
            {WRITEOFF_REASONS.map((c) => (
              <Text key={c} style={[s.cReason, s.bold]}>{qty(report.totals.byReason[c])}</Text>
            ))}
            <Text style={[s.cTotal, s.bold]}>{qty(report.totals.total)}</Text>
            <Text style={[s.cCost, s.bold]}>{money(report.totals.cost)}</Text>
          </View>
          <Text style={s.legend}>
            {WRITEOFF_REASONS.map((c) => `${c} = ${t(`writeoffs.reason.${c}`)}`).join("  ·  ")}
          </Text>
          <View style={s.signatures}>
            {["REVIEWS", "AUTHORIZES"].map((role) => (
              <View key={role} style={s.signature}>
                <View style={s.signatureLine} />
                <Text style={s.signatureLabel}>{t(`writeoffs.role.${role}`)}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}
