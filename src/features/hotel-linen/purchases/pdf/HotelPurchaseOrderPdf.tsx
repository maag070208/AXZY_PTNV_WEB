import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PurchaseOrderDetail } from "@entities/hotel-linen";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import PdfFooter from "@shared/pdf/PdfFooter";
import { PDF_COLORS, pdfTheme } from "@shared/pdf/theme";
import { i18n } from "@shared/i18n";
import { dyn } from "@shared/i18n/dyn";
import { day, money, pct, qty } from "../lib";

const tr = dyn(i18n.t);
const t = (key: string, options?: Record<string, unknown>) => tr(`hotel-linen-purchase:${key}`, options);

const s = StyleSheet.create({
  headerGrid: { flexDirection: "row", gap: 10, marginBottom: 12 },
  box: { flex: 1, borderWidth: 1, borderColor: PDF_COLORS.border, borderRadius: 6, padding: 10 },
  boxTitle: { fontSize: 7, fontFamily: "Helvetica-Bold", color: PDF_COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  label: { fontSize: 8, color: PDF_COLORS.muted },
  value: { fontSize: 8.5, fontFamily: "Helvetica-Bold" },
  folio: { fontSize: 16, fontFamily: "Helvetica-Bold", color: PDF_COLORS.band },
  cItem: { flex: 3.2 },
  cQty: { flex: 1.2, textAlign: "right" },
  cCost: { flex: 1.2, textAlign: "right" },
  cTax: { flex: 0.8, textAlign: "right" },
  cSub: { flex: 1.2, textAlign: "right" },
  cTotal: { flex: 1.3, textAlign: "right" },
  totals: { alignSelf: "flex-end", width: 210, marginTop: 10, borderWidth: 1, borderColor: PDF_COLORS.border, borderRadius: 6, padding: 10 },
  grand: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: PDF_COLORS.border, paddingTop: 6, marginTop: 4 },
  grandLabel: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  grandValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: PDF_COLORS.band },
  notes: { marginTop: 12, fontSize: 8, color: PDF_COLORS.muted },
  signatures: { flexDirection: "row", gap: 40, marginTop: 44, paddingHorizontal: 20 },
  signature: { flex: 1, alignItems: "center" },
  signatureLine: { borderTopWidth: 1, borderTopColor: PDF_COLORS.ink, width: "100%", marginBottom: 4 },
  signatureLabel: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  signatureName: { fontSize: 8, color: PDF_COLORS.muted },
});

/** Orden de compra del hotel: encabezado, detalle con IVA por renglón, totales y firmas. */
export default function HotelPurchaseOrderPdf({ order }: { order: PurchaseOrderDetail }) {
  const sup = order.supplier;
  return (
    <Document title={order.folio}>
      <Page size="LETTER" style={pdfTheme.page}>
        <PdfLetterhead title={`${t("pdf.title")} ${order.folio}`} generatedAt={new Date().toLocaleString("es-MX")} />
        <View style={pdfTheme.content}>
          <View style={s.headerGrid}>
            <View style={s.box}>
              <Text style={s.boxTitle}>{t("pdf.order")}</Text>
              <Text style={s.folio}>{order.folio}</Text>
              <View style={[s.row, { marginTop: 6 }]}>
                <Text style={s.label}>{t("pdf.date")}</Text>
                <Text style={s.value}>{day(order.createdAt)}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>{t("form.expected")}</Text>
                <Text style={s.value}>{day(order.expectedDate)}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>{t("pdf.createdBy")}</Text>
                <Text style={s.value}>{order.createdBy?.name ?? "—"}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>{t("form.warehouse")}</Text>
                <Text style={s.value}>{order.warehouse?.name ?? "—"}</Text>
              </View>
            </View>
            <View style={[s.box, { flex: 1.4 }]}>
              <Text style={s.boxTitle}>{t("form.supplier")}</Text>
              <Text style={[s.value, { fontSize: 11 }]}>{sup?.legalName ?? sup?.name ?? "—"}</Text>
              {sup?.legalName && <Text style={s.label}>{sup.name}</Text>}
              <View style={[s.row, { marginTop: 6 }]}>
                <Text style={s.label}>RFC</Text>
                <Text style={s.value}>{sup?.rfc ?? "—"}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>{t("pdf.contact")}</Text>
                <Text style={s.value}>{[sup?.phone, sup?.email].filter(Boolean).join(" · ") || "—"}</Text>
              </View>
            </View>
          </View>

          <View style={pdfTheme.tableHeader}>
            <Text style={[pdfTheme.tableHeaderText, s.cItem]}>{t("form.product")}</Text>
            <Text style={[pdfTheme.tableHeaderText, s.cQty]}>{t("form.quantity")}</Text>
            <Text style={[pdfTheme.tableHeaderText, s.cCost]}>{t("form.unitCost")}</Text>
            <Text style={[pdfTheme.tableHeaderText, s.cTax]}>{t("form.tax")}</Text>
            <Text style={[pdfTheme.tableHeaderText, s.cSub]}>{t("form.subtotal")}</Text>
            <Text style={[pdfTheme.tableHeaderText, s.cTotal]}>{t("form.total")}</Text>
          </View>
          {order.lines.map((l, i) => (
            <View key={l.id} style={[pdfTheme.tableRow, i % 2 === 1 ? pdfTheme.tableRowAlt : {}]} wrap={false}>
              <View style={s.cItem}>
                <Text style={pdfTheme.cellBold}>{l.product.name}</Text>
                <Text style={pdfTheme.cellMuted}>{[l.product.code, l.product.size].filter(Boolean).join(" · ")}</Text>
              </View>
              <Text style={[pdfTheme.cell, s.cQty]}>{`${qty(l.quantity)} ${l.product.unit}`}</Text>
              <Text style={[pdfTheme.cell, s.cCost]}>{money(l.unitCost)}</Text>
              <Text style={[pdfTheme.cell, s.cTax]}>{pct(l.taxRate)}</Text>
              <Text style={[pdfTheme.cell, s.cSub]}>{money(l.subtotal)}</Text>
              <Text style={[pdfTheme.cellBold, s.cTotal]}>{money(l.total)}</Text>
            </View>
          ))}

          <View style={s.totals} wrap={false}>
            <View style={s.row}>
              <Text style={s.label}>{t("form.subtotal")}</Text>
              <Text style={s.value}>{money(order.subtotal)}</Text>
            </View>
            {order.taxes.map((tx) => (
              <View key={tx.rate} style={s.row}>
                <Text style={s.label}>{t("pdf.taxLine", { rate: pct(tx.rate) })}</Text>
                <Text style={s.value}>{money(tx.tax)}</Text>
              </View>
            ))}
            <View style={s.grand}>
              <Text style={s.grandLabel}>{t("form.total")}</Text>
              <Text style={s.grandValue}>{money(order.total)}</Text>
            </View>
          </View>

          {order.notes ? <Text style={s.notes}>{`${t("form.notes")}: ${order.notes}`}</Text> : null}

          <View style={s.signatures} wrap={false}>
            <View style={s.signature}>
              <View style={s.signatureLine} />
              <Text style={s.signatureLabel}>{t("pdf.prepared")}</Text>
              <Text style={s.signatureName}>{order.createdBy?.name ?? " "}</Text>
            </View>
            <View style={s.signature}>
              <View style={s.signatureLine} />
              <Text style={s.signatureLabel}>{t("pdf.authorized")}</Text>
              <Text style={s.signatureName}>{order.approvedBy?.name ?? " "}</Text>
            </View>
          </View>
        </View>
        <PdfFooter note={t("pdf.footer")} />
      </Page>
    </Document>
  );
}
