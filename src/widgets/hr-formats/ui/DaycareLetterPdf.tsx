import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { LOGO_PUERTO_NUEVO_BASE64 } from "@shared/assets/logoPuertoNuevo";
import { formatLongDateEs, parseLocalDay } from "@shared/utils/dates";
import { EMPLOYER_REGISTRATION, EMPLOYER_RFC, type DaycareLetterData } from "../model/types";

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

/** Constancia para guardería: misma hoja que la carta laboral, con horario, descanso y vacaciones. */
export default function DaycareLetterPdf({ data }: { data: DaycareLetterData }) {
  const date = formatLongDateEs(parseLocalDay(data.date));
  const hire = formatLongDateEs(parseLocalDay(data.hireDate));
  const vacationFrom = formatLongDateEs(parseLocalDay(data.vacationFrom));
  const vacationTo = formatLongDateEs(parseLocalDay(data.vacationTo));
  const hasVacation = (data.vacationDays ?? 0) > 0 && !!vacationFrom && !!vacationTo;
  const treatment = data.treatment === "el" ? "el C." : "la C.";

  return (
    <Document title="Carta para guardería" author="Puerto Nuevo Hotel y Villas">
      <Page size="LETTER" style={styles.page}>
        <Image src={LOGO_PUERTO_NUEVO_BASE64} style={styles.logo} />
        <Text style={styles.date}>Playas de Rosarito B.C. a {date}.</Text>

        <Text style={{ marginBottom: 14 }}>A quien corresponda:</Text>

        <Text style={styles.paragraph}>
          Por medio de la presente hacemos de su conocimiento que {treatment}{" "}
          <Text style={styles.bold}>{blank(data.name)}</Text> con R.F.C. {blank(data.rfc)}, No. de IMSS:{" "}
          {blank(data.nss)}, No de CURP: {blank(data.curp)}, trabaja en la empresa HOTEL Y VILLAS PUERTO NUEVO SA DE
          CV, con registro patronal {EMPLOYER_REGISTRATION} y R.F.C. {EMPLOYER_RFC}, con el puesto de{" "}
          {blank(data.jobTitle)}, desde el {hire || "______"}, con un horario de {blank(data.schedule)}, de{" "}
          {blank(data.workDays)}, descansando los días {blank(data.restDays)}.
          {hasVacation
            ? ` Asimismo, goza de un periodo vacacional de ${data.vacationDays} días, comprendido del ${vacationFrom} al ${vacationTo}.`
            : ""}
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
