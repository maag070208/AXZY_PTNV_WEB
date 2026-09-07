import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { PrestamoRow } from "@core/api/reports.api";

interface Props {
  rows: PrestamoRow[];
  title?: string;
}

const BRAND = "#0f172a";
const ACCENT = "#2563eb";
const MUTED = "#64748b";
const LIGHT = "#f1f5f9";
const BORDER = "#e2e8f0";

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 30,
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1e293b",
    backgroundColor: "#fff",
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
    color: "#fff",
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
  cell: { fontSize: 8, color: "#334155" },
  cellBold: { fontSize: 8, fontFamily: "Helvetica-Bold", color: BRAND },
  cellMuted: { fontSize: 7.5, color: MUTED },
  cellDescTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#334155" },
  cellDescSub: { fontSize: 6.8, color: MUTED, marginTop: 1 },
  badgeCarta: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: "#15803d",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  badgeMovimiento: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: "#b45309",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  badgeDesconocido: {
    fontSize: 6.8,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    backgroundColor: LIGHT,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  diasAlerta: {
    fontSize: 8,
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

const origenBadgeStyle = (origen: PrestamoRow["origen"]) =>
  origen === "CARTA"
    ? styles.badgeCarta
    : origen === "MOVIMIENTO"
    ? styles.badgeMovimiento
    : styles.badgeDesconocido;

const origenLabel = (origen: PrestamoRow["origen"]) =>
  origen === "CARTA" ? "Carta" : origen === "MOVIMIENTO" ? "Movimiento" : "Desconocido";

export default function PrestamoPDF({ rows, title = "Reporte de Préstamos Activos" }: Props) {
  const today = fmtDate(new Date().toISOString());
  const totalPrestamos = rows.length;
  const conCarta = rows.filter((r) => r.origen === "CARTA").length;
  const promedioDias = rows.length
    ? Math.round(
        rows.reduce((acc, r) => acc + (r.diasPrestado ?? 0), 0) / rows.length
      )
    : 0;
  const deptos = new Set(rows.map((r) => r.departamento).filter(Boolean)).size;

  const ROWS_PER_PAGE = 28;
  const pages: PrestamoRow[][] = [];
  for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
    pages.push(rows.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const COL = {
    activo: 68,
    desc: 112,
    resp: 92,
    depto: 70,
    folio: 50,
    fecha: 48,
    dias: 36,
    origen: 42,
  };

  return (
    <Document title={title} author="Puerto Nuevo Hotel y Villas">
      {pages.map((pageRows, pageIdx) => (
        <Page key={pageIdx} size="LETTER" style={styles.page}>
          {pageIdx === 0 && (
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
                <Text style={styles.headerDate}>Página {pageIdx + 1} de {pages.length}</Text>
              </View>
            </View>
          )}

          {pageIdx === 0 && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{totalPrestamos}</Text>
                <Text style={styles.summaryLabel}>Préstamos activos</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: "#15803d" }]}>{conCarta}</Text>
                <Text style={styles.summaryLabel}>Con carta responsiva</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: "#dc2626" }]}>{promedioDias}</Text>
                <Text style={styles.summaryLabel}>Días promedio</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: ACCENT }]}>{deptos}</Text>
                <Text style={styles.summaryLabel}>Departamentos</Text>
              </View>
            </View>
          )}

          {pageIdx > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: BORDER, borderBottomStyle: "solid" }}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: BRAND }}>{title}</Text>
              <Text style={{ fontSize: 8, color: MUTED }}>Página {pageIdx + 1} de {pages.length}</Text>
            </View>
          )}

          <View style={styles.tableHeader}>
            <View style={{ width: COL.activo }}><Text style={styles.tableHeaderText}>Activo</Text></View>
            <View style={{ width: COL.desc }}><Text style={styles.tableHeaderText}>Descripción</Text></View>
            <View style={{ width: COL.resp }}><Text style={styles.tableHeaderText}>Responsable</Text></View>
            <View style={{ width: COL.depto }}><Text style={styles.tableHeaderText}>Departamento</Text></View>
            <View style={{ width: COL.folio }}><Text style={styles.tableHeaderText}>Folio</Text></View>
            <View style={{ width: COL.fecha }}><Text style={styles.tableHeaderText}>Fecha</Text></View>
            <View style={{ width: COL.dias }}><Text style={styles.tableHeaderText}>Días</Text></View>
            <View style={{ width: COL.origen }}><Text style={styles.tableHeaderText}>Origen</Text></View>
          </View>

          {pageRows.map((r, i) => (
            <View key={r.deviceId + i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <View style={{ width: COL.activo }}><Text style={styles.cellBold}>{r.controlActivos}</Text></View>
              <View style={{ width: COL.desc }}>
                <Text style={styles.cellDescTitle}>{r.descripcion}</Text>
                <Text style={styles.cellDescSub}>{r.tipo} · {r.marca} {r.modelo}</Text>
              </View>
              <View style={{ width: COL.resp }}><Text style={styles.cell}>{r.responsable}</Text></View>
              <View style={{ width: COL.depto }}><Text style={styles.cellMuted}>{r.departamento ?? "—"}</Text></View>
              <View style={{ width: COL.folio }}><Text style={styles.cellMuted}>{r.folio ?? "—"}</Text></View>
              <View style={{ width: COL.fecha }}><Text style={styles.cellMuted}>{fmtDate(r.fecha)}</Text></View>
              <View style={{ width: COL.dias }}>
                <Text style={(r.diasPrestado ?? 0) > 30 ? styles.diasAlerta : styles.cell}>
                  {r.diasPrestado ?? "—"}
                </Text>
              </View>
              <View style={{ width: COL.origen }}>
                <Text style={origenBadgeStyle(r.origen)}>{origenLabel(r.origen)}</Text>
              </View>
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
