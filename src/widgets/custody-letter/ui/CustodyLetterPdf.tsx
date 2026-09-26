import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { formatDate } from "@shared/utils/dates";
import { useTranslation } from "react-i18next";
import type { Loan } from "@entities/inventory";
import { LOGO_PUERTO_NUEVO_BASE64 } from "@shared/assets/logoPuertoNuevo";
import { resolveAreaName } from "../model/custodyLetter";

interface Props {
  loan: Loan;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingLeft: 32,
    paddingRight: 14,
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#000",
    backgroundColor: "#fff",
    lineHeight: 1.2,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  logoBox: { flexDirection: "row", alignItems: "center" },
  logo: { width: 80, height: 80 },
  metaBox: {
    borderWidth: 0.8,
    borderColor: "#000",
    borderStyle: "solid",
    width: 200,
    padding: 3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 2,
  },
  metaLabel: { width: 75, fontSize: 8.5, fontFamily: "Helvetica-Bold" },
  metaVal: {
    flex: 1,
    textAlign: "center",
    borderBottomWidth: 0.8,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
    fontSize: 8.5,
    paddingBottom: 1,
    minHeight: 10,
  },
  metaPageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 0,
  },
  metaPageLabel: { width: 50, fontSize: 8.5, fontFamily: "Helvetica-Bold" },
  folioBar: {
    backgroundColor: "#b4c6e7",
    borderWidth: 0.8,
    borderColor: "#000",
    borderStyle: "solid",
    fontFamily: "Helvetica-Bold",
    paddingVertical: 2.5,
    paddingHorizontal: 5,
    fontSize: 9,
  },
  principalBlock: {
    borderWidth: 0.8,
    borderColor: "#000",
    borderStyle: "solid",
    borderTopWidth: 0,
    padding: 5,
    paddingBottom: 0,
  },
  paragraph: {
    marginBottom: 2,
    textAlign: "justify",
    lineHeight: 1.25,
  },
  paragraphIntro: {
    marginBottom: 2,
    textAlign: "justify",
    lineHeight: 1.1,
  },
  bold: { fontFamily: "Helvetica-Bold" },
  commitments: {
    marginVertical: 1,
    marginLeft: 8,
    lineHeight: 1.2,
  },
  commitmentItem: { marginBottom: 0.5 },
  resourceTitle: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
    fontSize: 8.5,
  },
  resourceList: { marginTop: 0 },
  resourceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 1,
  },
  recLabel: { width: 95, fontSize: 8 },
  recVal: {
    flex: 1,
    borderBottomWidth: 0.8,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
    fontFamily: "Helvetica-Bold",
    paddingLeft: 3,
    textTransform: "uppercase",
    fontSize: 8,
    paddingBottom: 0,
    minHeight: 9,
  },
  followUpBlock: {
    borderWidth: 0.8,
    borderColor: "#000",
    borderStyle: "solid",
    marginTop: 3,
  },
  followUpBar: {
    backgroundColor: "#d9d9d9",
    borderBottomWidth: 0.8,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
    paddingVertical: 1.5,
    paddingHorizontal: 5,
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
  },
  followUpContent: { padding: 10 },
  fieldLine: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 2,
  },
  secLabel: { marginRight: 4, fontSize: 9.5 },
  secLine: {
    flex: 1,
    borderBottomWidth: 0.8,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
    height: 8,
  },
  emptyLine: {
    borderBottomWidth: 0.8,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
    height: 9,
    marginBottom: 2,
  },
  noteRh: {
    marginTop: 3,
    fontSize: 7.5,
  },
  signatures: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 50,
    marginBottom: 0,
  },
  signatureBox: {
    width: 140,
    alignItems: "center",
  },
  signatureLine: {
    width: "100%",
    borderTopWidth: 0.8,
    borderTopColor: "#000",
    borderTopStyle: "solid",
    marginBottom: 1.5,
  },
  signatureLabel: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  signatureName: { fontSize: 8 },
});

export default function CustodyLetterPdf({ loan }: Props) {
  const { t: tt } = useTranslation("custody-letters");
  const dateTxt = formatDate(loan.date) || tt("doc.dateLetters");
  const firstItem = loan.items?.[0] ?? null;
  const areaName = resolveAreaName(loan);

  const custodianName = loan.custodian?.name ?? "";
  const supervisorName = "";
  const deliveryBy = "Departamento de Sistemas";

  const observableTxt = loan.department?.name
    ? `${loan.department.name}${loan.subarea ? ` — ${loan.subarea.name}` : ""}`
    : "";
  // En modo departamento la carta se asigna a un departamento, no a un
  // empleado: la firma "Responsable" y el dato muestran el departamento.
  const custodianTxt = observableTxt || custodianName || "";

  const totalPieces = loan.items.reduce((sum, d) => sum + d.quantity, 0);
  const pieces = `${totalPieces} ${totalPieces === 1 ? "pieza" : "pieces"}`;
  const descriptionWithQuantity =
    (firstItem?.device?.name || "CONTROL DE TV") + ` (${pieces})`;

  // El documento oficial se llama "SIS-001" — nuestro folio (consecutivo)
  // NO debe aparecer en el PDF.
  const officialDocument = "SIS-001";

  const assetTag = firstItem?.units?.[0]?.deviceUnit?.assetTag ?? "TBE-0001";
  const serialNumber = firstItem?.units?.[0]?.deviceUnit?.serialNumber;
  const hostname = firstItem?.units?.[0]?.deviceUnit?.hostname;

  return (
    <Document
      title={`${officialDocument} - ${tt("detail.title")}`}
      author="Puerto Nuevo Hotel y Villas"
    >
      <Page size="LETTER" style={styles.page}>
        {/* 1. Encabezado superior */}
        <View style={styles.topHeader}>
          <View style={styles.logoBox}>
            <Image src={LOGO_PUERTO_NUEVO_BASE64} style={styles.logo} />
          </View>
          <View style={styles.metaBox}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{tt("doc.date")}</Text>
              <Text style={styles.metaVal}>{dateTxt}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>
                {loan.departmentId ? tt("doc.department") : tt("doc.employeeNo")}
              </Text>
              <Text style={styles.metaVal}>
                {loan.departmentId
                  ? custodianTxt
                  : loan.custodian?.employeeNumber || "N/A"}
              </Text>
            </View>
            <View style={styles.metaPageRow}>
              <Text style={styles.metaPageLabel}>{tt("doc.page")}</Text>
              <Text style={styles.metaVal}>{tt("doc.pageOf", { current: 1, total: 1 })}</Text>
            </View>
          </View>
        </View>

        {/* 2. Barra de título con folio */}
        <View style={styles.folioBar}>
          <Text>{tt("doc.folioBar")}</Text>
        </View>

        {/* 3. Bloque de contenido principal */}
        <View style={styles.principalBlock}>
          <Text style={styles.paragraphIntro}>
            {tt("doc.para1a")}{" "}
            <Text style={styles.bold}>{tt("doc.resourceTic")}</Text>{" "}
            {tt("doc.para1b")}{" "}
            <Text style={styles.bold}>
              {"Puerto Nuevo Hotel y Villas."}
            </Text>
            {tt("doc.para1c")}
          </Text>

          <View style={styles.commitments}>
            <Text style={styles.commitmentItem}>• {tt("doc.compromiso1")}</Text>
            <Text style={styles.commitmentItem}>• {tt("doc.compromiso2")}</Text>
            <Text style={styles.commitmentItem}>• {tt("doc.compromiso3")}</Text>
            <Text style={styles.commitmentItem}>• {tt("doc.compromiso4")}</Text>
            <Text style={styles.commitmentItem}>• {tt("doc.compromiso5")}</Text>
          </View>

          <Text style={styles.resourceTitle}>{tt("doc.resourceTitle")}</Text>
          <View style={styles.resourceList}>
            <View style={styles.resourceRow}>
              <Text style={styles.recLabel}>{tt("doc.descriptionGeneral")}</Text>
              <Text style={styles.recVal}>{descriptionWithQuantity}</Text>
            </View>
            <View style={styles.resourceRow}>
              <Text style={styles.recLabel}>{tt("doc.brand")}</Text>
              <Text style={styles.recVal}>{firstItem?.device?.brand || "STEREN"}</Text>
            </View>
            <View style={styles.resourceRow}>
              <Text style={styles.recLabel}>{tt("doc.model")}</Text>
              <Text style={styles.recVal}>{firstItem?.device?.model || "RM-115"}</Text>
            </View>
            {serialNumber && (
              <View style={styles.resourceRow}>
                <Text style={styles.recLabel}>{tt("doc.serialNumber")}</Text>
                <Text style={styles.recVal}>{serialNumber}</Text>
              </View>
            )}
            {hostname && (
              <View style={styles.resourceRow}>
                <Text style={styles.recLabel}>{tt("doc.hostname")}</Text>
                <Text style={styles.recVal}>{hostname}</Text>
              </View>
            )}
            <View style={styles.resourceRow}>
              <Text style={styles.recLabel}>{tt("doc.assetTag")}</Text>
              <Text style={styles.recVal}>{assetTag}</Text>
            </View>
            <View style={styles.resourceRow}>
              <Text style={styles.recLabel}>{tt("doc.area")}</Text>
              <Text style={styles.recVal}>{areaName}</Text>
            </View>
          </View>

          <Text style={{ ...styles.paragraph, marginTop: 6 }}>
            {tt("doc.para2a")}{" "}
            <Text style={styles.bold}>
              {tt("doc.departmentRegulations")} {areaName}
            </Text>{" "}
            {tt("doc.para2b")}{" "}
            <Text style={styles.bold}>{tt("doc.strictlyProhibited")}</Text>{" "}
            {tt("doc.para2c")}{" "}
            <Text style={styles.bold}>{tt("doc.interiorRegulations")}</Text>
          </Text>
        </View>

        {/* 4. Bloque de Seguimiento */}
        <View style={styles.followUpBlock} wrap={false}>
          <View style={styles.followUpBar}>
            <Text>{tt("doc.followUpBar")}</Text>
          </View>
          <View style={styles.followUpContent}>
            <View style={styles.fieldLine}>
              <Text style={styles.secLabel}>{tt("doc.loanReturnDate")}</Text>
              <View style={styles.secLine} />
            </View>
            <View style={styles.fieldLine}>
              <Text style={styles.secLabel}>{tt("doc.nameKeeper")}</Text>
              <View style={styles.secLine} />
            </View>
            <View style={styles.fieldLine}>
              <Text style={styles.secLabel}>
                {tt("doc.conditionsReturns")}
              </Text>
              <View style={styles.secLine} />
            </View>
            <View style={styles.emptyLine} />
            <View style={styles.emptyLine} />

            <Text style={styles.noteRh}>
              <Text style={styles.bold}>{tt("doc.noteRh1")}</Text> {tt("doc.noteRh2")}
            </Text>
          </View>
        </View>

        {/* 5. Firmas (3 columnas) */}
        <View style={styles.signatures}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{custodianTxt}</Text>
            <Text style={styles.signatureLabel}>{tt("doc.signatureCustodian")}</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{supervisorName}</Text>
            <Text style={styles.signatureLabel}>{tt("doc.signatureHeadArea")}</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{deliveryBy}</Text>
            <Text style={styles.signatureLabel}>{tt("doc.signatureDelivery")}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}