import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { formatFecha, type CartaResponsiva } from "@core/store/cartas/types";

interface Props {
  carta: CartaResponsiva;
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
  logo: { width: 318, height: 80 },
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

export default function CartaPDF({ carta }: Props) {
  const fechaTxt = formatFecha(carta.fecha) || "DD MES AAAA";
  const item = carta.items?.[0] ?? null;
  const departamentoNombre = (carta.departamento || "Sistemas").replace(
    /^Departamento de /i,
    ""
  );

  const responsableName = carta.responsable?.name ?? "";
  const encargadoName = carta.encargado?.name ?? "";
  const deliveryBy = carta.deliveryBy || "Departamento de Mantenimiento";

  // descripción con cantidad si > 1
  const descripcionConCantidad =
    (item?.descripcion || "CONTROL DE TV(5 PIEZAS)") +
    ((carta.cantidad ?? 1) > 1 ? ` (${carta.cantidad} piezas)` : "");

  return (
    <Document
      title={`${carta.consecutivo} - Carta Responsiva`}
      author="Puerto Nuevo Hotel y Villas"
    >
      <Page size="LETTER" style={styles.page}>
        {/* 1. Encabezado superior */}
        <View style={styles.topHeader}>
          <View style={styles.logoBox}>
            <Image src="/logo-puerto-nuevo.png" style={styles.logo} />
          </View>
          <View style={styles.metaBox}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Fecha:</Text>
              <Text style={styles.metaVal}>{fechaTxt}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>No. de empleado:</Text>
              <Text style={styles.metaVal}>
                {carta.numeroEmpleado || "N/A"}
              </Text>
            </View>
            <View style={styles.metaPaginaRow}>
              <Text style={styles.metaPaginaLabel}>Página:</Text>
              <Text style={styles.metaVal}>1 de 1</Text>
            </View>
          </View>
        </View>

        {/* 2. Barra de título con folio */}
        <View style={styles.barraFolio}>
          <Text>
            {carta.consecutivo || "F-MMTO-0001"} Carta responsiva del
            Departamento de {departamentoNombre}
          </Text>
        </View>

        {/* 3. Bloque de contenido principal */}
        <View style={styles.bloquePrincipal}>
          <Text style={styles.parrafoIntro}>
            Recibí autorización de uso y/o acceso al siguiente{" "}
            <Text style={styles.bold}>
              Recurso de TIC (Tecnología de la Información y la Comunicación)
            </Text>{" "}
            propiedad de{" "}
            <Text style={styles.bold}>
              {carta.empresa || "Puerto Nuevo Hotel y Villas."}
            </Text>
            , siendo éste para uso exclusivo de las actividades laborales de la
            empresa, por lo que tomo responsabilidad sobre el mismo y me
            comprometo a:
          </Text>

          <View style={styles.compromisos}>
            <Text style={styles.compromisoItem}>
              • No divulgar y/o facilitar la información que se encuentra
              almacenada.
            </Text>
            <Text style={styles.compromisoItem}>
              • No facilitar el acceso a personas internas o externas de la
              empresa.
            </Text>
            <Text style={styles.compromisoItem}>
              • No utilizarlo en perjuicio de la empresa y/o en beneficio
              propio.
            </Text>
            <Text style={styles.compromisoItem}>
              • Devolverlo cuando sea solicitado y/o al término de mi relación
              laboral con la empresa.
            </Text>
            <Text style={styles.compromisoItem}>
              • Prevenir el robo o el daño parcial o total del mismo.
            </Text>
          </View>

          <Text style={styles.recursoTitulo}>Recurso TIC:</Text>
          <View style={styles.recursoLista}>
            <View style={styles.recursoRow}>
              <Text style={styles.recLabel}>Descripción general:</Text>
              <Text style={styles.recVal}>{descripcionConCantidad}</Text>
            </View>
            <View style={styles.recursoRow}>
              <Text style={styles.recLabel}>Marca:</Text>
              <Text style={styles.recVal}>{item?.marca || "STEREN"}</Text>
            </View>
            <View style={styles.recursoRow}>
              <Text style={styles.recLabel}>Modelo:</Text>
              <Text style={styles.recVal}>{item?.modelo || "RM-115"}</Text>
            </View>
            <View style={styles.recursoRow}>
              <Text style={styles.recLabel}>Número de serie:</Text>
              <Text style={styles.recVal}>{item?.numeroSerie || "N/A"}</Text>
            </View>
            <View style={styles.recursoRow}>
              <Text style={styles.recLabel}>Nombre del equipo:</Text>
              <Text style={styles.recVal}>
                {item?.nombreEquipo || "N/A"}
              </Text>
            </View>
            <View style={styles.recursoRow}>
              <Text style={styles.recLabel}>Control de activos:</Text>
              <Text style={styles.recVal}>
                {item?.controlActivos || "TBE-0001"}
              </Text>
            </View>
            <View style={styles.recursoRow}>
              <Text style={styles.recLabel}>Área:</Text>
              <Text style={styles.recVal}>
                {item?.area || "MANTENIMIENTO"}
              </Text>
            </View>
          </View>

          <Text style={{ ...styles.parrafo, marginTop: 6 }}>
            Así mismo, declaro estar enterado del{" "}
            <Text style={styles.bold}>
              Reglamento del Departamento de {departamentoNombre}
            </Text>{" "}
            y de los compromisos que adquiero al ser usuario del equipo
            asignado, por lo que queda{" "}
            <Text style={styles.bold}>estrictamente prohibido</Text> cambiarlo
            por otro diferente al original y en caso de pérdida y/o daño por
            negligencia, me comprometo a pagar los daños ocasionados,
            autorizando a la empresa a realizar los descuentos correspondientes
            consecuencia de la negligencia y/o aplicar lo estipulado en el{" "}
            <Text style={styles.bold}>Reglamento Interior de Trabajo.</Text>
          </Text>
        </View>

        {/* 4. Bloque de Seguimiento */}
        <View style={styles.bloqueSeguimiento} wrap={false}>
          <View style={styles.barraSeguimiento}>
            <Text>Seguimiento en caso de retorno</Text>
          </View>
          <View style={styles.seguimientoContenido}>
            <View style={styles.lineaCampo}>
              <Text style={styles.segLabel}>Fecha de devolución:</Text>
              <View style={styles.segLine} />
            </View>
            <View style={styles.lineaCampo}>
              <Text style={styles.segLabel}>Nombre de quien resguarda:</Text>
              <View style={styles.segLine} />
            </View>
            <View style={styles.lineaCampo}>
              <Text style={styles.segLabel}>
                Condiciones en las que se devuelve:
              </Text>
              <View style={styles.segLine} />
            </View>
            <View style={styles.lineaVacia} />
            <View style={styles.lineaVacia} />

            <Text style={styles.notaRh}>
              <Text style={styles.bold}>Nota:</Text> Una vez devuelto, esta
              carta debe permanecer bajo resguardo del Departamento de Recursos
              Humanos.
            </Text>
          </View>
        </View>

        {/* 5. Firmas (3 columnas) */}
        <View style={styles.firmas}>
          <View style={styles.firmaBox}>
            <View style={styles.lineaFirma} />
            <Text style={styles.firmaNombre}>{responsableName}</Text>
            <Text style={styles.firmaLabel}>Responsable</Text>
          </View>
          <View style={styles.firmaBox}>
            <View style={styles.lineaFirma} />
            <Text style={styles.firmaNombre}>{encargadoName}</Text>
            <Text style={styles.firmaLabel}>Jefe de área</Text>
          </View>
          <View style={styles.firmaBox}>
            <View style={styles.lineaFirma} />
            <Text style={styles.firmaNombre}>{deliveryBy}</Text>
            <Text style={styles.firmaLabel}>Entrega</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}