import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { AmenityLine, AmenitySignature } from "@entities/hotel-linen";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import PdfFooter from "@shared/pdf/PdfFooter";
import { PDF_COLORS, pdfTheme } from "@shared/pdf/theme";
import { i18n } from "@shared/i18n";
import { dyn } from "@shared/i18n/dyn";
import { fmt, fmtDay, fmtPct } from "../lib";

const tr = dyn(i18n.t);
const t = (key: string, options?: Record<string, unknown>) => tr(`hotel-linen-amenity:${key}`, options);

export interface AmenityPdfData {
  folio: string | null;
  areaName: string;
  weekFrom: string;
  weekTo: string;
  occupiedNights: number;
  lines: AmenityLine[];
  signatures: AmenitySignature[];
}

const s = StyleSheet.create({
  title: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  meta: { flexDirection: "row", gap: 16, marginBottom: 10 },
  metaItem: { fontSize: 8.5 },
  metaLabel: { color: PDF_COLORS.muted },
  head: { flexDirection: "row", backgroundColor: PDF_COLORS.band, paddingVertical: 4, paddingHorizontal: 4 },
  headText: { color: PDF_COLORS.white, fontSize: 7, fontFamily: "Helvetica-Bold", textAlign: "right" },
  row: { flexDirection: "row", paddingVertical: 3, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: PDF_COLORS.border },
  cNo: { width: 20 },
  cName: { flex: 3.4 },
  cNum: { flex: 1.1, textAlign: "right" },
  cell: { fontSize: 8 },
  danger: { color: PDF_COLORS.danger, fontFamily: "Helvetica-Bold" },
  foot: { marginTop: 8, fontSize: 7.5, color: PDF_COLORS.muted },
  signatures: { flexDirection: "row", gap: 40, marginTop: 36, paddingHorizontal: 20 },
  signature: { flex: 1, alignItems: "center" },
  signatureLine: { borderTopWidth: 1, borderTopColor: PDF_COLORS.ink, width: "100%", marginBottom: 4 },
  signatureLabel: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  signatureName: { fontSize: 8, color: PDF_COLORS.muted },
});

const COLUMNS = ["standard", "initial", "supplied", "extras", "final", "real", "expected", "diff"] as const;

/** Formato "Control semanal de amenidades por área" (página 19 del proceso del hotel). */
export default function AmenityControlPdf({ data }: { data: AmenityPdfData }) {
  const by = (role: AmenitySignature["role"]) => data.signatures.find((x) => x.role === role)?.user.name ?? " ";
  return (
    <Document title={data.folio ?? t("pdf.title")}>
      <Page size="LETTER" orientation="landscape" style={pdfTheme.page}>
        <PdfLetterhead title={`${t("pdf.title")}${data.folio ? ` ${data.folio}` : ""}`} generatedAt={new Date().toLocaleString("es-MX")} />
        <View style={pdfTheme.content}>
          <View style={s.meta}>
            <Text style={s.metaItem}><Text style={s.metaLabel}>{`${t("pdf.area")}: `}</Text>{data.areaName}</Text>
            <Text style={s.metaItem}><Text style={s.metaLabel}>{`${t("pdf.week")}: `}</Text>{`${fmtDay(data.weekFrom)} – ${fmtDay(data.weekTo)}`}</Text>
            <Text style={s.metaItem}><Text style={s.metaLabel}>{`${t("pdf.occupied")}: `}</Text>{String(data.occupiedNights)}</Text>
            <Text style={s.metaItem}><Text style={s.metaLabel}>{`${t("pdf.supervisor")}: `}</Text>{by("CONFIRMS")}</Text>
          </View>

          <View style={s.head} fixed>
            <Text style={[s.headText, s.cNo, { textAlign: "left" }]}>{t("pdf.no")}</Text>
            <Text style={[s.headText, s.cName, { textAlign: "left" }]}>{t("pdf.item")}</Text>
            {COLUMNS.map((c) => (
              <Text key={c} style={[s.headText, s.cNum]}>{t(`pdf.col.${c}`)}</Text>
            ))}
          </View>
          {data.lines.map((l, i) => (
            <View key={l.product.id} style={s.row} wrap={false}>
              <Text style={[s.cell, s.cNo]}>{i + 1}</Text>
              <Text style={[s.cell, s.cName]}>{l.product.name}</Text>
              <Text style={[s.cell, s.cNum]}>{fmt(l.standardPerRoom)}</Text>
              <Text style={[s.cell, s.cNum]}>{fmt(l.initialStock)}</Text>
              <Text style={[s.cell, s.cNum]}>{fmt(l.supplied)}</Text>
              <Text style={[s.cell, s.cNum]}>{fmt(l.extras)}</Text>
              <Text style={[s.cell, s.cNum]}>{fmt(l.finalStock)}</Text>
              <Text style={[s.cell, s.cNum]}>{fmt(l.realConsumption)}</Text>
              <Text style={[s.cell, s.cNum]}>{fmt(l.expectedConsumption)}</Text>
              <Text style={[s.cell, s.cNum, ...(l.flagged ? [s.danger] : [])]}>{fmtPct(l.diffPct)}</Text>
            </View>
          ))}
          <Text style={s.foot}>{t("pdf.formula")}</Text>

          <View style={s.signatures} wrap={false}>
            {([["CONFIRMS", "pdf.prepared"], ["REVIEWS", "pdf.reviewed"], ["AUTHORIZES", "pdf.acknowledged"]] as const).map(([role, label]) => (
              <View key={role} style={s.signature}>
                <View style={s.signatureLine} />
                <Text style={s.signatureLabel}>{t(label)}</Text>
                <Text style={s.signatureName}>{by(role)}</Text>
              </View>
            ))}
          </View>
        </View>
        <PdfFooter note={t("pdf.footer")} />
      </Page>
    </Document>
  );
}
