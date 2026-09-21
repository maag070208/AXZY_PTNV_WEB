import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { formatFecha } from "@shared/utils/dates";
import { useTranslation } from "react-i18next";
import type { ActaAdministrativa } from "@entities/personal";
import { LOGO_PUERTO_NUEVO_BASE64 } from "@shared/assets/logoPuertoNuevo";

interface Props {
  acta: ActaAdministrativa;
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
  metaLabel: { width: 60, fontSize: 8.5, fontFamily: "Helvetica-Bold" },
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
  barraTitulo: {
    backgroundColor: "#d9d9d9",
    borderWidth: 0.8,
    borderColor: "#000",
    borderStyle: "solid",
    fontFamily: "Helvetica-Bold",
    paddingVertical: 3,
    paddingHorizontal: 5,
    fontSize: 11,
    textAlign: "center",
  },
  bloquePrincipal: {
    borderWidth: 0.8,
    borderColor: "#000",
    borderStyle: "solid",
    borderTopWidth: 0,
    padding: 6,
  },
  parrafo: {
    marginBottom: 4,
    textAlign: "justify",
    lineHeight: 1.3,
  },
  bold: { fontFamily: "Helvetica-Bold" },
  datos: { marginTop: 3, marginBottom: 4 },
  datoRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 2,
  },
  datoLabel: { width: 95, fontSize: 8.5, fontFamily: "Helvetica-Bold" },
  datoVal: {
    flex: 1,
    borderBottomWidth: 0.8,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
    fontSize: 8.5,
    paddingLeft: 3,
    paddingBottom: 0,
    minHeight: 10,
  },
  seccionTitulo: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    marginBottom: 2,
    marginTop: 3,
  },
  descripcion: {
    borderWidth: 0.6,
    borderColor: "#000",
    borderStyle: "solid",
    padding: 4,
    fontSize: 8.5,
    lineHeight: 1.35,
    textAlign: "justify",
    minHeight: 40,
  },
  firmaRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 30,
  },
  firmaBox: { width: 140, alignItems: "center" },
  lineaFirma: {
    width: "100%",
    borderTopWidth: 0.8,
    borderTopColor: "#000",
    borderTopStyle: "solid",
    marginBottom: 1.5,
  },
  firmaLabel: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  firmaNombre: { fontSize: 8 },
});

export default function ActaAdministrativaPDF({ acta }: Props) {
  const { t: tt } = useTranslation("actas");
  const fechaActa = formatFecha(acta.createdAt) || "";
  const fechaIncidente = formatFecha(acta.fechaIncidente) || "";
  const empleado = acta.user.name;
  const area = acta.user.department?.name
    ? `${acta.user.department.name}${acta.user.subarea ? ` — ${acta.user.subarea.name}` : ""}`
    : "—";
  const firmaRh = acta.createdBy.name || "—";

  return (
    <Document title={tt("doc.tituloDocumento")} author="Puerto Nuevo Hotel y Villas">
      <Page size="LETTER" style={styles.page}>
        <View style={styles.topHeader}>
          <View style={styles.logoBox}>
            <Image src={LOGO_PUERTO_NUEVO_BASE64} style={styles.logo} />
          </View>
          <View style={styles.metaBox}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{tt("doc.fecha")}</Text>
              <Text style={styles.metaVal}>{fechaActa}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{tt("doc.empleado")}</Text>
              <Text style={styles.metaVal}>{empleado}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{tt("doc.motivo")}</Text>
              <Text style={styles.metaVal}>{tt(`motivos.${acta.motivo}`)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.barraTitulo}>
          <Text>{tt("doc.tituloDocumento")}</Text>
        </View>

        <View style={styles.bloquePrincipal}>
          <Text style={styles.parrafo}>
            {tt("doc.para1a")}{" "}
            <Text style={styles.bold}>{empleado}</Text>{" "}
            {tt("doc.para1b")}{" "}
            <Text style={styles.bold}>{tt(`motivos.${acta.motivo}`)}</Text>{" "}
            {tt("doc.para1c")} <Text style={styles.bold}>{fechaIncidente}</Text>{" "}
            {tt("doc.para1d")}
          </Text>

          <View style={styles.datos}>
            <View style={styles.datoRow}>
              <Text style={styles.datoLabel}>{tt("doc.empleado")}</Text>
              <Text style={styles.datoVal}>{empleado}</Text>
            </View>
            <View style={styles.datoRow}>
              <Text style={styles.datoLabel}>{tt("doc.numeroEmpleado")}</Text>
              <Text style={styles.datoVal}>{acta.user.numeroEmpleado ?? "—"}</Text>
            </View>
            <View style={styles.datoRow}>
              <Text style={styles.datoLabel}>{tt("doc.puesto")}</Text>
              <Text style={styles.datoVal}>{acta.user.puesto ?? "—"}</Text>
            </View>
            <View style={styles.datoRow}>
              <Text style={styles.datoLabel}>{tt("doc.departamento")}</Text>
              <Text style={styles.datoVal}>{area}</Text>
            </View>
            <View style={styles.datoRow}>
              <Text style={styles.datoLabel}>{tt("doc.motivo")}</Text>
              <Text style={styles.datoVal}>{tt(`motivos.${acta.motivo}`)}</Text>
            </View>
            <View style={styles.datoRow}>
              <Text style={styles.datoLabel}>{tt("doc.fechaIncidente")}</Text>
              <Text style={styles.datoVal}>{fechaIncidente}</Text>
            </View>
          </View>

          <Text style={styles.seccionTitulo}>{tt("doc.descripcion")}</Text>
          <Text style={styles.descripcion}>{acta.descripcion}</Text>

          {acta.sancion && (
            <>
              <Text style={styles.seccionTitulo}>{tt("doc.sancion")}</Text>
              <Text style={styles.descripcion}>{acta.sancion}</Text>
            </>
          )}

          <Text style={{ ...styles.parrafo, marginTop: 6, marginBottom: 0 }}>
            {tt("doc.cierre")}
          </Text>
        </View>

        <View style={styles.firmaRow}>
          <View style={styles.firmaBox}>
            <View style={styles.lineaFirma} />
            <Text style={styles.firmaNombre}>{empleado}</Text>
            <Text style={styles.firmaLabel}>{tt("doc.firmaEmpleado")}</Text>
          </View>
          <View style={styles.firmaBox}>
            <View style={styles.lineaFirma} />
            <Text style={styles.firmaNombre} />
            <Text style={styles.firmaLabel}>{tt("doc.firmaJefe")}</Text>
          </View>
          <View style={styles.firmaBox}>
            <View style={styles.lineaFirma} />
            <Text style={styles.firmaNombre}>{firmaRh}</Text>
            <Text style={styles.firmaLabel}>{tt("doc.firmaRh")}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}