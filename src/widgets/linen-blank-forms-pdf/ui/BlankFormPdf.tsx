import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import PdfFooter from "@shared/pdf/PdfFooter";
import { PDF_COLORS, pdfTheme } from "@shared/pdf/theme";
import { i18n } from "@shared/i18n";
import { dyn } from "@shared/i18n/dyn";

const tr = dyn(i18n.t);
const t = (key: string) => tr(`hotel-linen-report:${key}`);

export interface BlankFormConfig {
  /** Clave del formato (`blank.form.<kind>` da el título). */
  kind: string;
  /** Campos de encabezado a llenar a mano. */
  meta: string[];
  /** Columnas de la tabla (claves bajo `blank.col`). La primera lleva el artículo si hay catálogo. */
  columns: string[];
  /** Artículos del catálogo vivo, uno por renglón; vacío = renglones en blanco. */
  items: Array<{ code: string; label: string }>;
  /** Renglones en blanco extra al final. */
  blankRows: number;
  /** Roles de firma al pie (claves bajo `blank.sign`). */
  signatures: string[];
}

const s = StyleSheet.create({
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 18, marginBottom: 10 },
  metaItem: { width: "30%", flexDirection: "row", alignItems: "flex-end", fontSize: 8.5 },
  metaLine: { flex: 1, borderBottomWidth: 0.7, borderBottomColor: PDF_COLORS.ink, marginLeft: 4, height: 11 },
  head: { flexDirection: "row", backgroundColor: PDF_COLORS.band, paddingVertical: 4, paddingHorizontal: 3 },
  headText: { color: PDF_COLORS.white, fontSize: 7, fontFamily: "Helvetica-Bold", textAlign: "center" },
  row: { flexDirection: "row", borderBottomWidth: 0.7, borderBottomColor: PDF_COLORS.border, minHeight: 20, alignItems: "center", paddingHorizontal: 3 },
  cellBox: { borderLeftWidth: 0.5, borderLeftColor: PDF_COLORS.border, height: 20 },
  item: { fontSize: 8 },
  signatures: { flexDirection: "row", gap: 40, marginTop: 36, paddingHorizontal: 20 },
  signature: { flex: 1, alignItems: "center" },
  signatureLine: { borderTopWidth: 1, borderTopColor: PDF_COLORS.ink, width: "100%", marginBottom: 4 },
  signatureLabel: { fontSize: 8, fontFamily: "Helvetica-Bold" },
});

/** Formato de respaldo en blanco (págs. 13–19 del proceso del hotel), con el catálogo vivo de artículos. */
export default function BlankFormPdf({ config }: { config: BlankFormConfig }) {
  const hasItems = config.items.length > 0;
  const title = t(`blank.form.${config.kind}`);
  const blanks = Array.from({ length: config.blankRows }, (_, i) => i);
  return (
    <Document title={title}>
      <Page size="LETTER" orientation="landscape" style={pdfTheme.page}>
        <PdfLetterhead title={title} generatedAt={new Date().toLocaleString("es-MX")} />
        <View style={pdfTheme.content}>
          <View style={s.meta}>
            {config.meta.map((m) => (
              <View key={m} style={s.metaItem}>
                <Text>{t(`blank.meta.${m}`)}:</Text>
                <View style={s.metaLine} />
              </View>
            ))}
          </View>
          <View style={s.head} fixed>
            {config.columns.map((c, i) => (
              <Text key={c} style={[s.headText, { flex: i === 0 && hasItems ? 3 : 1 }]}>{t(`blank.col.${c}`)}</Text>
            ))}
          </View>
          {config.items.map((item) => (
            <View key={item.code} style={s.row} wrap={false}>
              <Text style={[s.item, { flex: 3 }]}>{item.label}</Text>
              {config.columns.slice(1).map((c) => (
                <View key={c} style={[s.cellBox, { flex: 1 }]} />
              ))}
            </View>
          ))}
          {blanks.map((i) => (
            <View key={`blank-${i}`} style={s.row} wrap={false}>
              {config.columns.map((c, ci) => (
                <View key={c} style={[ci === 0 ? { height: 20 } : s.cellBox, { flex: ci === 0 && hasItems ? 3 : 1 }]} />
              ))}
            </View>
          ))}
          <View style={s.signatures} wrap={false}>
            {config.signatures.map((role) => (
              <View key={role} style={s.signature}>
                <View style={s.signatureLine} />
                <Text style={s.signatureLabel}>{t(`blank.sign.${role}`)}</Text>
              </View>
            ))}
          </View>
        </View>
        <PdfFooter />
      </Page>
    </Document>
  );
}
