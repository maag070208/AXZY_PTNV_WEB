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
import type { Prestamo } from "@entities/inventario";
import { LOGO_PUERTO_NUEVO_BASE64 } from "@shared/assets/logoPuertoNuevo";

interface Props {
  prestamo: Prestamo;
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
  metaPaginaRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 0,
  },
  metaPaginaLabel: { width: 50, fontSize: 8.5, fontFamily: "Helvetica-Bold" },
  barraFolio: {
    backgroundColor: "#b4c6e7",
    borderWidth: 0.8,
    borderColor: "#000",
    borderStyle: "solid",
    fontFamily: "Helvetica-Bold",
    paddingVertical: 2.5,
    paddingHorizontal: 5,
    fontSize: 9,
  },
  bloquePrincipal: {
    borderWidth: 0.8,
    borderColor: "#000",
    borderStyle: "solid",
    borderTopWidth: 0,
    padding: 5,
    paddingBottom: 0,
  },
  parrafo: {
    marginBottom: 2,
    textAlign: "justify",
    lineHeight: 1.25,
  },
  parrafoIntro: {
    marginBottom: 2,
    textAlign: "justify",
    lineHeight: 1.1,
  },
  bold: { fontFamily: "Helvetica-Bold" },
  compromisos: {
    marginVertical: 1,
    marginLeft: 8,
    lineHeight: 1.2,
  },
  compromisoItem: { marginBottom: 0.5 },
  recursoTitulo: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
    fontSize: 8.5,
  },
  recursoLista: { marginTop: 0 },
  recursoRow: {
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
  bloqueSeguimiento: {
    borderWidth: 0.8,
    borderColor: "#000",
    borderStyle: "solid",
    marginTop: 3,
  },
  barraSeguimiento: {
    backgroundColor: "#d9d9d9",
    borderBottomWidth: 0.8,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
    paddingVertical: 1.5,
    paddingHorizontal: 5,
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
  },
  seguimientoContenido: { padding: 10 },
  lineaCampo: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 2,
  },
  segLabel: { marginRight: 4, fontSize: 9.5 },
  segLine: {
    flex: 1,
    borderBottomWidth: 0.8,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
    height: 8,
  },
  lineaVacia: {
    borderBottomWidth: 0.8,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
    height: 9,
    marginBottom: 2,
  },
  notaRh: {
    marginTop: 3,
    fontSize: 7.5,
  },
  firmas: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 50,
    marginBottom: 0,
  },
  firmaBox: {
    width: 140,
    alignItems: "center",
  },
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

export default function CartaResponsivaPDF({ prestamo }: Props) {
  const { t: tt } = useTranslation("cartas");
  const fechaTxt = formatFecha(prestamo.fecha) || tt("doc.dateLetters");
  const primerDetalle = prestamo.detalles?.[0] ?? null;
  const departamentoNombre = (prestamo.departamento?.name || "Sistemas").replace(
    /^Departamento de /i,
    ""
  );

  const responsableName = prestamo.responsable?.name ?? "";
  const encargadoName = "";
  const deliveryBy = "Departamento de Sistemas";

  const observableTxt = prestamo.departamento?.name
    ? `${prestamo.departamento.name}${prestamo.subarea ? ` — ${prestamo.subarea.name}` : ""}`
    : "";
  // En modo departamento la carta se asigna a un departamento, no a un
  // empleado: la firma "Responsable" y el dato muestran el departamento.
  const responsableTxt = observableTxt || responsableName || "";

  const totalPiezas = prestamo.detalles.reduce((sum, d) => sum + d.cantidad, 0);
  const piezas = `${totalPiezas} ${totalPiezas === 1 ? "pieza" : "piezas"}`;
  const descripcionConCantidad =
    (primerDetalle?.dispositivo?.nombre || "CONTROL DE TV") + ` (${piezas})`;

  // El documento oficial se llama "SIS-001" — nuestro folio (consecutivo)
  // NO debe aparecer en el PDF.
  const documentoOficial = "SIS-001";

  const activoFijo = primerDetalle?.unidades?.[0]?.unidadFisica?.activoFijo ?? "TBE-0001";
  const numeroSerie = primerDetalle?.unidades?.[0]?.unidadFisica?.numeroSerie;
  const nombreEquipo = primerDetalle?.unidades?.[0]?.unidadFisica?.nombreEquipo;

  return (
    <Document
      title={`${documentoOficial} - ${tt("detail.title")}`}
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
              <Text style={styles.metaVal}>{fechaTxt}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>
                {prestamo.departamentoId ? tt("doc.departamento") : tt("doc.employeeNo")}
              </Text>
              <Text style={styles.metaVal}>
                {prestamo.departamentoId
                  ? responsableTxt
                  : prestamo.responsable?.numeroEmpleado || "N/A"}
              </Text>
            </View>
            <View style={styles.metaPaginaRow}>
              <Text style={styles.metaPaginaLabel}>{tt("doc.page")}</Text>
              <Text style={styles.metaVal}>{tt("doc.pageOf", { current: 1, total: 1 })}</Text>
            </View>
          </View>
        </View>

        {/* 2. Barra de título con folio */}
        <View style={styles.barraFolio}>
          <Text>{tt("doc.barraFolio")}</Text>
        </View>

        {/* 3. Bloque de contenido principal */}
        <View style={styles.bloquePrincipal}>
          <Text style={styles.parrafoIntro}>
            {tt("doc.para1a")}{" "}
            <Text style={styles.bold}>{tt("doc.recursoTic")}</Text>{" "}
            {tt("doc.para1b")}{" "}
            <Text style={styles.bold}>
              {"Puerto Nuevo Hotel y Villas."}
            </Text>
            {tt("doc.para1c")}
          </Text>

          <View style={styles.compromisos}>
            <Text style={styles.compromisoItem}>• {tt("doc.compromiso1")}</Text>
            <Text style={styles.compromisoItem}>• {tt("doc.compromiso2")}</Text>
            <Text style={styles.compromisoItem}>• {tt("doc.compromiso3")}</Text>
            <Text style={styles.compromisoItem}>• {tt("doc.compromiso4")}</Text>
            <Text style={styles.compromisoItem}>• {tt("doc.compromiso5")}</Text>
          </View>

          <Text style={styles.recursoTitulo}>{tt("doc.recursoTitulo")}</Text>
          <View style={styles.recursoLista}>
            <View style={styles.recursoRow}>
              <Text style={styles.recLabel}>{tt("doc.descripcionGeneral")}</Text>
              <Text style={styles.recVal}>{descripcionConCantidad}</Text>
            </View>
            <View style={styles.recursoRow}>
              <Text style={styles.recLabel}>{tt("doc.marca")}</Text>
              <Text style={styles.recVal}>{primerDetalle?.dispositivo?.marca || "STEREN"}</Text>
            </View>
            <View style={styles.recursoRow}>
              <Text style={styles.recLabel}>{tt("doc.modelo")}</Text>
              <Text style={styles.recVal}>{primerDetalle?.dispositivo?.modelo || "RM-115"}</Text>
            </View>
            {numeroSerie && (
              <View style={styles.recursoRow}>
                <Text style={styles.recLabel}>{tt("doc.numeroSerie")}</Text>
                <Text style={styles.recVal}>{numeroSerie}</Text>
              </View>
            )}
            {nombreEquipo && (
              <View style={styles.recursoRow}>
                <Text style={styles.recLabel}>{tt("doc.nombreEquipo")}</Text>
                <Text style={styles.recVal}>{nombreEquipo}</Text>
              </View>
            )}
            <View style={styles.recursoRow}>
              <Text style={styles.recLabel}>{tt("doc.controlActivos")}</Text>
              <Text style={styles.recVal}>{activoFijo}</Text>
            </View>
            <View style={styles.recursoRow}>
              <Text style={styles.recLabel}>{tt("doc.area")}</Text>
              <Text style={styles.recVal}>{"MANTENIMIENTO"}</Text>
            </View>
          </View>

          <Text style={{ ...styles.parrafo, marginTop: 6 }}>
            {tt("doc.para2a")}{" "}
            <Text style={styles.bold}>
              {tt("doc.reglamentoDepartamento")} {departamentoNombre}
            </Text>{" "}
            {tt("doc.para2b")}{" "}
            <Text style={styles.bold}>{tt("doc.estrictamenteProhibido")}</Text>{" "}
            {tt("doc.para2c")}{" "}
            <Text style={styles.bold}>{tt("doc.reglamentoInterior")}</Text>
          </Text>
        </View>

        {/* 4. Bloque de Seguimiento */}
        <View style={styles.bloqueSeguimiento} wrap={false}>
          <View style={styles.barraSeguimiento}>
            <Text>{tt("doc.seguimientoBarra")}</Text>
          </View>
          <View style={styles.seguimientoContenido}>
            <View style={styles.lineaCampo}>
              <Text style={styles.segLabel}>{tt("doc.fechaDevolucion")}</Text>
              <View style={styles.segLine} />
            </View>
            <View style={styles.lineaCampo}>
              <Text style={styles.segLabel}>{tt("doc.nombreResguarda")}</Text>
              <View style={styles.segLine} />
            </View>
            <View style={styles.lineaCampo}>
              <Text style={styles.segLabel}>
                {tt("doc.condicionesDevuelve")}
              </Text>
              <View style={styles.segLine} />
            </View>
            <View style={styles.lineaVacia} />
            <View style={styles.lineaVacia} />

            <Text style={styles.notaRh}>
              <Text style={styles.bold}>{tt("doc.notaRh1")}</Text> {tt("doc.notaRh2")}
            </Text>
          </View>
        </View>

        {/* 5. Firmas (3 columnas) */}
        <View style={styles.firmas}>
          <View style={styles.firmaBox}>
            <View style={styles.lineaFirma} />
            <Text style={styles.firmaNombre}>{responsableTxt}</Text>
            <Text style={styles.firmaLabel}>{tt("doc.firmaResponsable")}</Text>
          </View>
          <View style={styles.firmaBox}>
            <View style={styles.lineaFirma} />
            <Text style={styles.firmaNombre}>{encargadoName}</Text>
            <Text style={styles.firmaLabel}>{tt("doc.firmaJefeArea")}</Text>
          </View>
          <View style={styles.firmaBox}>
            <View style={styles.lineaFirma} />
            <Text style={styles.firmaNombre}>{deliveryBy}</Text>
            <Text style={styles.firmaLabel}>{tt("doc.firmaEntrega")}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}