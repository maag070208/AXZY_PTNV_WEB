import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { LOGO_PUERTO_NUEVO_BASE64 } from "@shared/assets/logoPuertoNuevo";
import { formatLongDateEs, parseLocalDay } from "@shared/utils/dates";
import type { ApercibimientoLetterData } from "../model/types";

const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 48, paddingHorizontal: 64, fontSize: 11, fontFamily: "Helvetica", color: "#000", lineHeight: 1.5 },
  logo: { width: 80, height: 80 },
  bold: { fontFamily: "Helvetica-Bold" },
  paragraph: { textAlign: "justify", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, marginBottom: 4 },
  signatures: { flexDirection: "row", justifyContent: "space-between", marginTop: 40 },
  col: { width: "46%", alignItems: "center" },
  line: { width: "100%", borderTopWidth: 0.8, borderTopColor: "#000", borderTopStyle: "solid", marginBottom: 3 },
  center: { textAlign: "center" },
});

export default function ApercibimientoLetterPdf({ data }: { data: ApercibimientoLetterData }) {
  const date = formatLongDateEs(parseLocalDay(data.date));
  // Cada renglón del texto capturado es un párrafo.
  const irregularities = data.irregularities.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  return (
    <Document title="Carta de apercibimiento" author="Puerto Nuevo Hotel y Villas">
      <Page size="LETTER" style={styles.page}>
        <Image src={LOGO_PUERTO_NUEVO_BASE64} style={styles.logo} />

        <View style={styles.row}>
          <Text>
            <Text style={styles.bold}>A la atención de: </Text>
            {data.name}
          </Text>
          <Text>
            <Text style={styles.bold}>Puesto: </Text>
            {data.jobTitle}
          </Text>
        </View>
        <Text style={{ textAlign: "right", marginBottom: 14 }}>En Rosarito Baja California, a {date}</Text>
        <Text style={{ ...styles.bold, marginBottom: 12 }}>ASUNTO: APERCIBIMIENTO</Text>

        <Text style={styles.paragraph}>
          Por medio de la presente, se le apercibe para corregir la calidad y diligencia en el desempeño de su
          trabajo debido a que, se han detectado irregularidades en su gestión de:
        </Text>
        {irregularities.map((line, i) => (
          <Text key={i} style={styles.paragraph}>
            {line}
          </Text>
        ))}
        <Text style={styles.paragraph}>
          Pues bien, y a pesar de la gravedad de estos hechos, la Empresa ha decidido no tomar ninguna medida
          disciplinaria al respecto, le dirigimos la presente para recordarle la necesidad de que actúe con la
          diligencia debida en el ejercicio de sus funciones y con atento cumplimiento de la normativa, puesto que,
          de lo contrario, la Administración del Hotel se vería obligada a adoptar las medidas disciplinarias que
          resulten oportunas.
        </Text>
        <Text style={styles.paragraph}>
          Sin otro particular, firme copia de la presente a los meros efectos de darse por notificado del contenido
          de la misma.
        </Text>

        <Text style={{ ...styles.center, marginTop: 8 }}>Atentamente,</Text>
        <View style={styles.signatures} wrap={false}>
          <View style={styles.col}>
            <View style={styles.line} />
            <Text style={{ ...styles.bold, ...styles.center }}>{data.signerName.toUpperCase()}</Text>
            <Text style={styles.center}>{data.signerTitle.toUpperCase()}</Text>
          </View>
          <View style={styles.col}>
            <View style={styles.line} />
            <Text style={{ ...styles.bold, ...styles.center }}>{data.headName.toUpperCase()}</Text>
            <Text style={styles.center}>JEFE DE ÁREA</Text>
          </View>
        </View>
        <View style={{ marginTop: 48, alignItems: "center" }} wrap={false}>
          <View style={{ ...styles.line, width: 240 }} />
          <Text style={styles.center}>NOMBRE Y FIRMA. NOTIFICACIÓN RECIBIDA</Text>
        </View>
      </Page>
    </Document>
  );
}
