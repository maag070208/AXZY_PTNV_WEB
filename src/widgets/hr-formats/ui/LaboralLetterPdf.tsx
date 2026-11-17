import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { LOGO_PUERTO_NUEVO_BASE64 } from "@shared/assets/logoPuertoNuevo";
import { formatLongDateEs, parseLocalDay } from "@shared/utils/dates";
import { amountToWordsMxn, formatMxn } from "@shared/utils/numberToWords";
import type { LaboralLetterData } from "../model/types";

const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 48, paddingHorizontal: 64, fontSize: 11, fontFamily: "Helvetica", color: "#000", lineHeight: 1.5 },
  logo: { width: 80, height: 80 },
  date: { textAlign: "right", marginTop: 24, marginBottom: 28 },
  bold: { fontFamily: "Helvetica-Bold" },
  paragraph: { textAlign: "justify", marginBottom: 14 },
  signature: { marginTop: 56, alignItems: "center" },
  line: { width: 200, borderTopWidth: 0.8, borderTopColor: "#000", borderTopStyle: "solid", marginBottom: 3 },
});

const blank = (v: string) => (v.trim() ? v.trim() : "______");

export default function LaboralLetterPdf({ data }: { data: LaboralLetterData }) {
  const date = formatLongDateEs(parseLocalDay(data.date));
  const hire = formatLongDateEs(parseLocalDay(data.hireDate));
  const salary = data.salary ?? 0;
  const treatment = data.treatment === "el" ? "el C." : "la C.";

  return (
    <Document title="Carta laboral" author="Puerto Nuevo Hotel y Villas">
      <Page size="LETTER" style={styles.page}>
        <Image src={LOGO_PUERTO_NUEVO_BASE64} style={styles.logo} />
        <Text style={styles.date}>Playas de Rosarito B.C. a {date}.</Text>

        {data.addressee.trim() ? <Text style={styles.bold}>{data.addressee.trim().toUpperCase()}</Text> : null}
        <Text style={{ ...styles.bold, marginBottom: 14 }}>PRESENTE:</Text>

        <Text style={styles.paragraph}>
          Por medio de la presente hacemos de su conocimiento que {treatment}{" "}
          <Text style={styles.bold}>{blank(data.name)}</Text>, No. de IMSS: {blank(data.nss)} y No de CURP:{" "}
          {blank(data.curp)}, RFC: {blank(data.rfc)}. labora en HOTEL Y VILLAS PUERTO NUEVO SA DE CV, con el puesto
          de {blank(data.jobTitle)}, desde el {hire || "______"}, percibiendo un sueldo mensual neto por la cantidad
          de: <Text style={styles.bold}>{formatMxn(salary)}</Text> ({amountToWordsMxn(salary)}).
        </Text>
        <Text style={styles.paragraph}>
          Agradeciendo de antemano la atención a la presente quedo a sus órdenes ante cualquier duda o aclaración al
          respecto.
        </Text>

        <View style={styles.signature}>
          <Text style={{ marginBottom: 36 }}>Atentamente,</Text>
          <View style={styles.line} />
          <Text style={styles.bold}>{data.signerName}</Text>
          <Text>{data.signerTitle}</Text>
        </View>
      </Page>
    </Document>
  );
}
