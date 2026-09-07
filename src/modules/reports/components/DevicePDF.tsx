import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { DeviceReportRow } from "@core/api/reports.api";

interface Props {
  rows: DeviceReportRow[];
  title?: string;
}

const BRAND = "#0f172a";
const ACCENT = "#2563eb";
const MUTED = "#64748b";
const LIGHT = "#f1f5f9";
const BORDER = "#e2e8f0";
const WHITE = "#ffffff";

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 30,
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1e293b",
    backgroundColor: WHITE,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: ACCENT,
    borderBottomStyle: "solid",
  },
  logo: { width: 48, height: 48 },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    marginBottom: 3,
  },
  headerSubtitle: { fontSize: 9, color: MUTED },
  headerDate: { fontSize: 8.5, color: MUTED, textAlign: "right", marginBottom: 2 },

  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  summaryCard: {
    flex: 1,
    backgroundColor: LIGHT,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    textAlign: "center",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: BRAND,
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 6,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  tableRowAlt: {
    flexDirection: "row",
    backgroundColor: "#fafbfc",
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  cell: { fontSize: 7.8, color: "#334155" },
  cellBold: { fontSize: 7.8, fontFamily: "Helvetica-Bold", color: BRAND },
  cellMuted: { fontSize: 7.3, color: MUTED },
  cellDescTitle: { fontSize: 7.8, fontFamily: "Helvetica-Bold", color: "#334155" },
  cellDescSub: { fontSize: 6.8, color: MUTED, marginTop: 1 },
  badge: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    textAlign: "center",
  },
  diasAlerta: {
    fontSize: 7.8,
    fontFamily: "Helvetica-Bold",
    color: "#dc2626",
  },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    borderTopStyle: "solid",
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: MUTED },
  footerPowered: { fontSize: 7, color: ACCENT, fontFamily: "Helvetica-Bold" },
});

const fmtDate = (d: string | null): string => {
  if (!d) return "—";
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = date.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

const badgeStyle = (estado: string) =>
  estado === "DISPONIBLE"
    ? { ...styles.badge, color: "#15803d", backgroundColor: "#dcfce7" }
    : estado === "ASIGNADO"
    ? { ...styles.badge, color: "#b45309", backgroundColor: "#fef3c7" }
    : { ...styles.badge, color: MUTED, backgroundColor: "#e2e8f0" };

export default function DevicePDF({ rows, title = "Reporte de Dispositivos" }: Props) {
  const today = fmtDate(new Date().toISOString());
  const disponibles = rows.filter((r) => r.estado === "DISPONIBLE").length;
  const prestados = rows.filter((r) => r.estado === "ASIGNADO").length;
  const bajas = rows.filter((r) => r.estado === "BAJA").length;
  const masDe30 = rows.filter((r) => (r.diasPrestado ?? 0) > 30).length;

  const ROWS_PER_PAGE = 28;
  const pages: DeviceReportRow[][] = [];
  for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
    pages.push(rows.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const COL = {
    activo: 68,
    desc: 144,
    cant: 28,
    estado: 50,
    resp: 94,
    depto: 72,
    dias: 34,
    folio: 36,
  };

  return (
    <Document title={title} author="Puerto Nuevo Hotel y Villas">
      {pages.map((pageRows, pageIdx) => (
        <Page key={pageIdx} size="LETTER" style={styles.page}>
          {pageIdx === 0 ? (
            <View style={styles.header}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Image src="/logo-puerto-nuevo.png" style={styles.logo} />
                <View>
                  <Text style={styles.headerTitle}>{title}</Text>
                  <Text style={styles.headerSubtitle}>Puerto Nuevo Hotel y Villas</Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.headerDate}>Fecha de generación: {today}</Text>
                <Text style={styles.headerDate}>
                  Página {pageIdx + 1} de {pages.length}
                </Text>
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: BORDER, borderBottomStyle: "solid" }}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: BRAND }}>{title}</Text>
              <Text style={{ fontSize: 8, color: MUTED }}>Página {pageIdx + 1} de {pages.length}</Text>
            </View>
          )}

          {pageIdx === 0 && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{rows.length}</Text>
                <Text style={styles.summaryLabel}>Dispositivos</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: "#15803d" }]}>{disponibles}</Text>
                <Text style={styles.summaryLabel}>Disponibles</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: "#b45309" }]}>{prestados}</Text>
                <Text style={styles.summaryLabel}>Prestados</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: "#dc2626" }]}>{masDe30}</Text>
                <Text style={styles.summaryLabel}>+30 días</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: MUTED }]}>{bajas}</Text>
                <Text style={styles.summaryLabel}>Baja</Text>
              </View>
            </View>
          )}

          <View style={styles.tableHeader}>
            <View style={{ width: COL.activo }}><Text style={styles.tableHeaderText}>Activo</Text></View>
            <View style={{ width: COL.desc }}><Text style={styles.tableHeaderText}>Descripción</Text></View>
            <View style={{ width: COL.cant }}><Text style={styles.tableHeaderText}>Cant.</Text></View>
            <View style={{ width: COL.estado }}><Text style={styles.tableHeaderText}>Estado</Text></View>
            <View style={{ width: COL.resp }}><Text style={styles.tableHeaderText}>Responsable</Text></View>
            <View style={{ width: COL.depto }}><Text style={styles.tableHeaderText}>Depto.</Text></View>
            <View style={{ width: COL.dias }}><Text style={styles.tableHeaderText}>Días</Text></View>
            <View style={{ width: COL.folio }}><Text style={styles.tableHeaderText}>Folio</Text></View>
          </View>

          {pageRows.map((r, i) => (
            <View key={r.deviceId + i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <View style={{ width: COL.activo }}><Text style={styles.cellBold}>{r.controlActivos}</Text></View>
              <View style={{ width: COL.desc }}>
                <Text style={styles.cellDescTitle}>{r.descripcion}</Text>
                <Text style={styles.cellDescSub}>{r.tipo} · {r.marca} {r.modelo}</Text>
              </View>
              <View style={{ width: COL.cant }}><Text style={styles.cell}>{r.cantidad}</Text></View>
              <View style={{ width: COL.estado }}>
                <Text style={badgeStyle(r.estado)}>{r.estado === "ASIGNADO" ? "Asignado" : r.estado === "DISPONIBLE" ? "Disponible" : "Baja"}</Text>
              </View>
              <View style={{ width: COL.resp }}><Text style={styles.cell}>{r.estado === "ASIGNADO" ? r.responsable ?? "—" : "—"}</Text></View>
              <View style={{ width: COL.depto }}><Text style={styles.cellMuted}>{r.estado === "ASIGNADO" ? r.departamento ?? "—" : "—"}</Text></View>
              <View style={{ width: COL.dias }}>
                <Text style={r.estado === "ASIGNADO" && (r.diasPrestado ?? 0) > 30 ? styles.diasAlerta : styles.cell}>
                  {r.estado === "ASIGNADO" ? r.diasPrestado ?? "—" : "—"}
                </Text>
              </View>
              <View style={{ width: COL.folio }}><Text style={styles.cellMuted}>{r.estado === "ASIGNADO" ? r.folio ?? "—" : "—"}</Text></View>
            </View>
          ))}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Sistema de Control de Activos — Puerto Nuevo Hotel y Villas</Text>
            <Text style={styles.footerPowered}>powered by axzy.dev</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}