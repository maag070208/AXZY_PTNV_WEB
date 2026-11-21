import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";
import { LOGO_PUERTO_NUEVO_BASE64 } from "@shared/assets/logoPuertoNuevo";
import { formatLongDateEs, parseLocalDay } from "@shared/utils/dates";
import type { RequestItem } from "../model/types";

/** Estilos compartidos por los formatos de solicitud (compra y cotización). */
export const formStyles = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 28, paddingHorizontal: 36, fontSize: 9, fontFamily: "Helvetica", color: "#000" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  logo: { width: 52, height: 52 },
  title: { flexGrow: 1, textAlign: "center", fontSize: 15, fontFamily: "Helvetica-Bold" },
  headerSpacer: { width: 52 },
  row: { flexDirection: "row" },
  field: { flexDirection: "row", alignItems: "flex-end", marginBottom: 6, paddingRight: 8 },
  label: { fontFamily: "Helvetica-Bold", marginRight: 4 },
  value: { flexGrow: 1, borderBottomWidth: 0.7, borderBottomColor: "#000", borderBottomStyle: "solid", minHeight: 12, paddingBottom: 1 },
  table: { borderTopWidth: 0.7, borderLeftWidth: 0.7, borderColor: "#000", borderStyle: "solid", marginTop: 4, marginBottom: 8 },
  tr: { flexDirection: "row" },
  cell: { borderRightWidth: 0.7, borderBottomWidth: 0.7, borderColor: "#000", borderStyle: "solid", paddingHorizontal: 3, paddingVertical: 2, minHeight: 17 },
  th: { fontFamily: "Helvetica-Bold", textAlign: "center", backgroundColor: "#e5e7eb" },
  sectionLabel: { fontFamily: "Helvetica-Bold", marginBottom: 2 },
  line: { borderBottomWidth: 0.7, borderBottomColor: "#000", borderBottomStyle: "solid", minHeight: 16, marginBottom: 2, justifyContent: "flex-end" },
  signatures: { flexDirection: "row", justifyContent: "space-between", marginTop: 26 },
  signature: { alignItems: "center", flexGrow: 1, flexBasis: 0, paddingHorizontal: 6 },
  signatureLine: { width: "100%", borderTopWidth: 0.8, borderTopColor: "#000", borderTopStyle: "solid", marginTop: 4, paddingTop: 2, textAlign: "center" },
});

export const FormHeader = ({ title }: { title: string }) => (
  <View style={formStyles.header}>
    <Image src={LOGO_PUERTO_NUEVO_BASE64} style={formStyles.logo} />
    <Text style={formStyles.title}>{title}</Text>
    <View style={formStyles.headerSpacer} />
  </View>
);

/** Fecha corta legible; vacía si no hay fecha. */
export const shortDate = (value: string): string => (value ? formatLongDateEs(parseLocalDay(value)) : "");

/** Campo con etiqueta y línea para escribir; `flex` reparte el ancho dentro de la fila. */
export const LineField = ({ label, value, flex = 1 }: { label: string; value?: string; flex?: number }) => (
  <View style={[formStyles.field, { flexGrow: flex, flexBasis: 0 }]}>
    <Text style={formStyles.label}>{label}</Text>
    <Text style={formStyles.value}>{value ?? ""}</Text>
  </View>
);

/** Bloque de líneas para texto libre (se rellena con líneas vacías hasta `lines`). */
export const LinesBlock = ({ label, value, lines }: { label: string; value: string; lines: number }) => {
  const parts = value.trim() ? value.split("\n") : [];
  const total = Math.max(lines, parts.length);
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={formStyles.sectionLabel}>{label}</Text>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={formStyles.line}>
          <Text>{parts[i] ?? ""}</Text>
        </View>
      ))}
    </View>
  );
};

export interface PdfColumn {
  label: string;
  width: string;
  /** Valor del renglón; sin función = columna vacía para llenar a mano. */
  get?: (item: RequestItem) => string;
  center?: boolean;
}

/** Tabla de renglones rellenada con filas vacías hasta `minRows`, como el papel. */
export const ItemsTable = ({ items, columns, minRows }: { items: RequestItem[]; columns: PdfColumn[]; minRows: number }) => {
  const filled = items.filter((i) => i.product || i.description || i.quantity || i.unit);
  const rows = Array.from({ length: Math.max(minRows, filled.length) }, (_, i) => filled[i]);
  return (
    <View style={formStyles.table}>
      <View style={formStyles.tr}>
        {columns.map((c) => (
          <Text key={c.label} style={[formStyles.cell, formStyles.th, { width: c.width }]}>
            {c.label}
          </Text>
        ))}
      </View>
      {rows.map((item, i) => (
        <View key={i} style={formStyles.tr} wrap={false}>
          {columns.map((c) => (
            <Text key={c.label} style={[formStyles.cell, { width: c.width, textAlign: c.center ? "center" : "left" }]}>
              {item && c.get ? c.get(item) : ""}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
};

export const SignatureBlock = ({ signatures }: { signatures: { label: string; name?: string }[] }) => (
  <View style={formStyles.signatures} wrap={false}>
    {signatures.map((s) => (
      <View key={s.label} style={formStyles.signature}>
        <Text style={{ minHeight: 11 }}>{s.name ?? ""}</Text>
        <Text style={formStyles.signatureLine}>{s.label}</Text>
      </View>
    ))}
  </View>
);
