import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { MaterialOutput } from "@core/api/salidas.api";

interface Props {
  rows: MaterialOutput[];
  area?: string;
  numeroEmpleado?: string;
}

const MESES = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

const fmtFecha = (d: Date): string => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = MESES[d.getMonth()];
  const yy = d.getFullYear();
  return `${dd}.${mm}.${yy}`;
};

const COL = {
  num: 20,
  desc: 110,
  modelo: 65,
  marca: 55,
  proyecto: 60,
  cantidad: 40,
  depto: 60,
  usuario: 55,
  obs: 101,
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 14,
    paddingBottom: 26,
    paddingLeft: 32,
    paddingRight: 14,
    fontSize: 8,
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
  logoBox: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 70, height: 70 },
  titleBox: { justifyContent: "center" },
  titleFolio: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  titleSub: { fontSize: 9, fontFamily: "Helvetica-Bold", marginTop: 1 },
  metaBox: {
    borderWidth: 0.8,
    borderColor: "#000",
    borderStyle: "solid",
    width: 190,
    padding: 3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 2,
  },
  metaLabel: { width: 78, fontSize: 8, fontFamily: "Helvetica-Bold" },
  metaVal: {
    flex: 1,
    textAlign: "center",
    borderBottomWidth: 0.8,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
    fontSize: 8,
    paddingBottom: 1,
    minHeight: 10,
  },
  table: {
    borderWidth: 0.8,
    borderColor: "#000",
    borderStyle: "solid",
    marginTop: 6,
  },
  tHeadRow: {
    flexDirection: "row",
    backgroundColor: "#e8e8e8",
    borderBottomWidth: 0.8,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
  },
  tRow: {
    flexDirection: "row",
    borderBottomWidth: 0.6,
    borderBottomColor: "#666",
    borderBottomStyle: "solid",
    minHeight: 16,
  },
  tRowAlt: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    borderBottomWidth: 0.6,
    borderBottomColor: "#666",
    borderBottomStyle: "solid",
    minHeight: 16,
  },
  th: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 3,
    paddingHorizontal: 3,
    borderRightWidth: 0.6,
    borderRightColor: "#000",
    borderRightStyle: "solid",
  },
  td: {
    fontSize: 7.5,
    paddingVertical: 3,
    paddingHorizontal: 3,
    borderRightWidth: 0.6,
    borderRightColor: "#999",
    borderRightStyle: "solid",
  },
  tdLast: {
    fontSize: 7.5,
    paddingVertical: 3,
    paddingHorizontal: 3,
  },
  footer: {
    position: "absolute",
    bottom: 10,
    left: 32,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.6,
    borderTopColor: "#999",
    borderTopStyle: "solid",
    paddingTop: 4,
  },
  footerText: { fontSize: 6.5, color: "#555" },
});

export default function SalidaBitacoraPDF({ rows, area, numeroEmpleado }: Props) {
  const ROWS_PER_PAGE = 25;
  const pages: MaterialOutput[][] = [];
  for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
    pages.push(rows.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const headerArea = area || rows[0]?.area || "Sistemas";
  const today = fmtFecha(new Date());

  return (
    <Document
      title="F-SIS-0005 Bitácora de Salida de Material"
      author="Puerto Nuevo Hotel y Villas"
    >
      {pages.map((pageRows, pageIdx) => (
        <Page key={pageIdx} size="LETTER" style={styles.page}>
          <View style={styles.topHeader}>
            <View style={styles.logoBox}>
              <Image src="/logo-puerto-nuevo.png" style={styles.logo} />
              <View style={styles.titleBox}>
                <Text style={styles.titleFolio}>F-SIS-0005</Text>
                <Text style={styles.titleSub}>Bitácora de Salida de Material</Text>
              </View>
            </View>
            <View style={styles.metaBox}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Fecha:</Text>
                <Text style={styles.metaVal}>{today}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>No. de empleado:</Text>
                <Text style={styles.metaVal}>{numeroEmpleado || ""}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Página:</Text>
                <Text style={styles.metaVal}>{pageIdx + 1} de {pages.length}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Área:</Text>
                <Text style={styles.metaVal}>{headerArea}</Text>
              </View>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tHeadRow}>
              <Text style={[styles.th, { width: COL.num }]}>#</Text>
              <Text style={[styles.th, { width: COL.desc }]}>Descripción</Text>
              <Text style={[styles.th, { width: COL.modelo }]}>Modelo</Text>
              <Text style={[styles.th, { width: COL.marca }]}>Marca</Text>
              <Text style={[styles.th, { width: COL.proyecto }]}>Proyecto</Text>
              <Text style={[styles.th, { width: COL.cantidad }]}>Cantidad</Text>
              <Text style={[styles.th, { width: COL.depto }]}>Departamento</Text>
              <Text style={[styles.th, { width: COL.usuario }]}>Usuario</Text>
              <Text style={[styles.th, { width: COL.obs, borderRightWidth: 0 }]}>
                Observaciones
              </Text>
            </View>

            {Array.from({ length: ROWS_PER_PAGE }).map((_, i) => {
              const r = pageRows[i];
              const rowStyle = r && i % 2 === 1 ? styles.tRowAlt : styles.tRow;
              return (
                <View key={i} style={rowStyle}>
                  <Text style={[styles.td, { width: COL.num }]}>{i + 1}</Text>
                  <Text style={[styles.td, { width: COL.desc }]}>{r?.descripcion ?? ""}</Text>
                  <Text style={[styles.td, { width: COL.modelo }]}>{r?.modelo ?? ""}</Text>
                  <Text style={[styles.td, { width: COL.marca }]}>{r?.marca ?? ""}</Text>
                  <Text style={[styles.td, { width: COL.proyecto }]}>{r?.proyecto ?? ""}</Text>
                  <Text style={[styles.td, { width: COL.cantidad }]}>
                    {r ? String(r.cantidad) : ""}
                  </Text>
                  <Text style={[styles.td, { width: COL.depto }]}>{r?.departamento ?? ""}</Text>
                  <Text style={[styles.td, { width: COL.usuario }]}>{r?.usuario ?? ""}</Text>
                  <Text style={[styles.tdLast, { width: COL.obs }]}>
                    {r?.observaciones ?? ""}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>
              F-SIS-0005 Bitácora de Salida de Material — Departamento de Sistemas
            </Text>
            <Text style={styles.footerText}>Generado el {today}</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}
