import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import type { PersonalProfile } from "@entities/personal";
import CredencialEmpleadoPDF from "../ui/CredencialEmpleadoPDF";
import { LOGO_PUERTO_NUEVO_BASE64 } from "@shared/assets/logoPuertoNuevo";

interface Props {
  profile: PersonalProfile;
  qrDataUrl: string;
  fotoDataUrl?: string | null;
  iniciales?: string;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingLeft: 32,
    paddingRight: 32,
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
    marginBottom: 6,
  },
  logoBox: { flexDirection: "row", alignItems: "center" },
  logo: { width: 80, height: 80 },
  barraTitulo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: PDF_COLORS.band,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  credencialTitulo: {
    fontFamily: "Helvetica-Bold",
    fontSize: 15,
    color: PDF_COLORS.band,
    textAlign: "center",
    marginTop: 8,
  },
  credencialSubtitulo: {
    fontSize: 9,
    color: PDF_COLORS.muted,
    textAlign: "center",
    marginBottom: 12,
  },
  cuerpo: {
    flexDirection: "row",
    gap: 12,
  },
  columnaFoto: { width: 110 },
  columnaDatos: { flex: 1 },
  fotoBox: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 6,
  },
  foto: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: PDF_COLORS.band,
    borderStyle: "solid",
  },
  fotoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: PDF_COLORS.band,
    justifyContent: "center",
    alignItems: "center",
  },
  iniciales: { fontSize: 22, color: "#fff", fontFamily: "Helvetica-Bold" },
  datoLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: PDF_COLORS.band },
  datoValue: { fontSize: 9, marginBottom: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.band,
    borderBottomStyle: "solid",
  },
  rowLabel: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  rowValue: { fontSize: 9 },
  qrBox: {
    alignItems: "center",
    marginTop: 12,
    padding: 4,
  },
  qr: { width: 112, height: 112 },
  qrLabel: { fontSize: 7.5, color: PDF_COLORS.muted, marginTop: 4 },
  pie: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 6,
    borderTopWidth: 0.6,
    borderTopColor: PDF_COLORS.band,
    borderTopStyle: "solid",
  },
  pieText: { fontSize: 7, color: PDF_COLORS.muted },
});

/** Credencial de empleado — PDF descargable con equal estructura al acta. */
export default function CredencialEmpleadoPDF({ profile, qrDataUrl, fotoDataUrl, iniciales }: Props) {
  const nombre = profile.name ?? "—";
  const numero = profile.numeroEmpleado ?? profile.id ?? "—";
  const puesto = profile.puesto ?? "—";
  const departamento = profile.department?.name ?? "—";

  return (
    <Document title={`Credencial — ${nombre}`} author="Puerto Nuevo Hotel y Villas">
      <Page size="LETTER" style={styles.page}>
        <View style={styles.topHeader}>
          <View style={styles.logoBox}>
            <Image src={LOGO_PUERTO_NUEVO_BASE64} style={styles.logo} />
          </View>
          <Text style={styles.credencialTitulo}>CREDENCIAL DE EMPLEADO</Text>
        </View>
        <Text style={styles.credencialSubtitulo}>
          Puerto Nuevo Hotel y Villas — Personal autorizado
        </Text>

        <View style={styles.cuerpo}>
          <View style={styles.columnaFoto}>
            {fotoDataUrl ? (
              <View style={styles.fotoBox}>
                <Image src={fotoDataUrl} style={styles.foto} />
              </View>
            ) : (
              <View style={styles.fotoPlaceholder}>
                <Text style={styles.iniciales}>{iniciales ?? "—"}</Text>
              </View>
            )}
          </View>

          <View style={styles.columnaDatos}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Número de empleado</Text>
              <Text style={styles.rowValue}>{numero}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Nombre completo</Text>
              <Text style={styles.rowValue}>{nombre}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Puesto</Text>
              <Text style={styles.rowValue}>{puesto}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Departamento</Text>
              <Text style={styles.rowValue}>{departamento}</Text>
            </View>
          </View>
        </View>

        <View>
          <View style={styles.qrBox}>
            {qrDataUrl ? (
              <Image src={qrDataUrl} style={styles.qr} />
            ) : (
              <Text style={styles.qrLabel}>Sin QR disponible</Text>
            )}
            <Text style={styles.qrLabel}>Escanea para verificar esta credencial</Text>
          </View>
          <View style={styles.pie}>
            <Text style={styles.pieText}>{profile.id}</Text>
            <Text style={styles.pieText}>credencial-empleado · {new Date().getFullYear()}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
