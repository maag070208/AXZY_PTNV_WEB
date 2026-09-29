import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PurchaseOrderDetail } from "@entities/kitchen";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import PdfFooter from "@shared/pdf/PdfFooter";
import { PDF_COLORS, pdfTheme } from "@shared/pdf/theme";
import { i18n } from "@shared/i18n";
import { dyn } from "@shared/i18n/dyn";

const tr = dyn(i18n.t);
const t = (key: string, options?: Record<string, unknown>) => tr(`kitchen:${key}`, options);
const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const qty = (n: number) => n.toLocaleString("es-MX", { maximumFractionDigits: 3 });
const pct = (r: number) => `${Math.round(r * 10000) / 100}%`;
const day = (iso: string | null) => (iso ? new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("es-MX") : "—");

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

/** Orden de compra lista para enviar al proveedor: encabezado, detalle con IVA por renglón, totales y firmas. */
export default function PurchaseOrderPdf({ order }: { order: PurchaseOrderDetail }) {
  const sup = order.supplier;
  const address = [sup.street, sup.neighborhood, sup.postalCode ? `CP ${sup.postalCode}` : null, sup.city, sup.state].filter(Boolean).join(", ");
  const contact = sup.primaryContact;
  const terms = (n: number | null) => (n == null ? "—" : n === 0 ? t("suppliers.hints.cash") : t("suppliers.hints.days", { count: n }));

  return (
    <Document title={order.number}>
      <Page size="LETTER" style={pdfTheme.page}>
        <PdfLetterhead title={`${t("pdf.poTitle")} ${order.number}`} generatedAt={new Date().toLocaleString("es-MX")} />
        <View style={pdfTheme.content}>
          <View style={s.headerGrid}>
            <View style={s.box}>
              <Text style={s.boxTitle}>{t("pdf.order")}</Text>
              <Text style={s.folio}>{order.number}</Text>
              <View style={[s.row, { marginTop: 6 }]}>
                <Text style={s.label}>{t("purchaseOrders.form.date")}</Text>
                <Text style={s.value}>{day(order.createdAt)}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>{t("purchaseOrders.form.expectedAt")}</Text>
                <Text style={s.value}>{day(order.expectedAt)}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>{t("purchaseOrders.form.createdBy")}</Text>
                <Text style={s.value}>{order.createdBy.name}</Text>
              </View>
              {order.approvedBy && (
                <View style={s.row}>
                  <Text style={s.label}>{t("pdf.approvedBy")}</Text>
                  <Text style={s.value}>{order.approvedBy.name}</Text>
                </View>
              )}
            </View>
            <View style={[s.box, { flex: 1.4 }]}>
              <Text style={s.boxTitle}>{t("purchaseOrders.form.supplier")}</Text>
              <Text style={[s.value, { fontSize: 11 }]}>{sup.legalName ?? sup.name}</Text>
              {sup.legalName && <Text style={s.label}>{sup.name}</Text>}
              <View style={[s.row, { marginTop: 6 }]}>
                <Text style={s.label}>{t("purchaseOrders.form.rfc")}</Text>
                <Text style={s.value}>{sup.rfc ?? "—"}</Text>
              </View>
              {address ? <Text style={[s.label, { marginBottom: 3 }]}>{address}</Text> : null}
              <View style={s.row}>
                <Text style={s.label}>{t("purchaseOrders.form.supplierContact")}</Text>
                <Text style={s.value}>{[contact?.name, contact?.phone ?? sup.phone].filter(Boolean).join(" · ") || "—"}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>{t("purchaseOrders.form.terms")}</Text>
                <Text style={s.value}>{t("purchaseOrders.form.supplierTerms", { credit: terms(sup.paymentTermsDays), lead: terms(sup.leadTimeDays) })}</Text>
              </View>
            </View>
          </View>

          <View style={pdfTheme.tableHeader}>
            <Text style={[pdfTheme.tableHeaderText, s.cItem]}>{t("purchaseOrders.form.item")}</Text>
            <Text style={[pdfTheme.tableHeaderText, s.cQty]}>{t("purchaseOrders.form.quantity")}</Text>
            <Text style={[pdfTheme.tableHeaderText, s.cCost]}>{t("purchaseOrders.form.unitCostShort")}</Text>
            <Text style={[pdfTheme.tableHeaderText, s.cTax]}>{t("purchaseOrders.form.tax")}</Text>
            <Text style={[pdfTheme.tableHeaderText, s.cSub]}>{t("purchaseOrders.form.subtotal")}</Text>
            <Text style={[pdfTheme.tableHeaderText, s.cTotal]}>{t("purchaseOrders.form.lineTotal")}</Text>
          </View>
          {order.lines.map((l, i) => {
            const inPack = l.purchaseUnit != null && l.purchaseQuantity != null && l.purchaseFactor != null;
            const unitCost = l.unitCost ?? 0;
            return (
              <View key={l.id} style={[pdfTheme.tableRow, i % 2 === 1 ? pdfTheme.tableRowAlt : {}]} wrap={false}>
                <View style={s.cItem}>
                  <Text style={pdfTheme.cellBold}>{l.item.name}</Text>
                  <Text style={pdfTheme.cellMuted}>{l.item.code}</Text>
                </View>
                <View style={s.cQty}>
                  <Text style={pdfTheme.cell}>{inPack ? `${qty(l.purchaseQuantity!)} ${l.purchaseUnit}` : `${qty(l.quantity)} ${l.item.unit.name}`}</Text>
                  {inPack && <Text style={pdfTheme.cellMuted}>{`${qty(l.quantity)} ${l.item.unit.name}`}</Text>}
                </View>
                <Text style={[pdfTheme.cell, s.cCost]}>{money(inPack ? unitCost * l.purchaseFactor! : unitCost)}</Text>
                <Text style={[pdfTheme.cell, s.cTax]}>{pct(l.taxRate)}</Text>
                <Text style={[pdfTheme.cell, s.cSub]}>{money(l.subtotal)}</Text>
                <Text style={[pdfTheme.cellBold, s.cTotal]}>{money(l.total)}</Text>
              </View>
            );
          })}

          <View style={s.totals} wrap={false}>
            <View style={s.row}>
              <Text style={s.label}>{t("purchaseOrders.form.subtotal")}</Text>
              <Text style={s.value}>{money(order.subtotal)}</Text>
            </View>
            {order.taxes.map((tx) => (
              <View key={tx.rate} style={s.row}>
                <Text style={s.label}>{t("purchaseOrders.form.taxLine", { rate: pct(tx.rate) })}</Text>
                <Text style={s.value}>{money(tx.tax)}</Text>
              </View>
            ))}
            <View style={s.grand}>
              <Text style={s.grandLabel}>{t("purchaseOrders.form.grandTotal")}</Text>
              <Text style={s.grandValue}>{money(order.total)}</Text>
            </View>
          </View>

          {order.notes ? <Text style={s.notes}>{`${t("purchaseOrders.form.notes")}: ${order.notes}`}</Text> : null}

          <View style={s.signatures} wrap={false}>
            <View style={s.signature}>
              <View style={s.signatureLine} />
              <Text style={s.signatureLabel}>{t("pdf.prepared")}</Text>
              <Text style={s.signatureName}>{order.createdBy.name}</Text>
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
