import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ReportRow } from "@core/api/reports.api";
import { CommonFooter } from "@modules/shared/components/pdf/CommonPDF";

interface Props {
  rows: ReportRow[];
  title?: string;
  filters?: {
    start?: string;
    end?: string;
    department?: string;
    employee?: string;
  };
}

const BRAND = "#0f172a";
const ACCENT = "#2563eb";
const MUTED = "#64748b";
const LIGHT = "#f1f5f9";
const BORDER = "#e2e8f0";
const WHITE = "#ffffff";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
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
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: ACCENT,
    borderBottomStyle: "solid",
  },
  logo: { width: 52, height: 52 },
  headerRight: {
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 9,
    color: MUTED,
  },
  headerDate: {
    fontSize: 9,
    color: MUTED,
    textAlign: "right",
  },

  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: LIGHT,
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  filterBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 0.5,
    borderColor: BORDER,
    borderStyle: "solid",
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  filterText: {
    fontSize: 8,
    color: "#475569",
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
    fontSize: 7,
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
  cell: {
    fontSize: 8,
    color: "#334155",
  },
  cellBold: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },
  cellMuted: {
    fontSize: 7.5,
    color: MUTED,
  },

  badgeAsignado: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#15803d",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  badgeDevuelto: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#b45309",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  badgePerdido: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#dc2626",
    backgroundColor: "#fee2e2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  badgeDefault: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    backgroundColor: LIGHT,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
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
  footerText: {
    fontSize: 7,
    color: MUTED,
  },
  footerPowered: {
    fontSize: 7,
    color: ACCENT,
    fontFamily: "Helvetica-Bold",
  },
});

const fmtDate = (d: Date | string | null): string => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = date.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

const fmtFilterDate = (iso?: string): string => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export default function ReportPDF({ rows, title = "Reporte de Entregas de Activos", filters }: Props) {
  const today = fmtDate(new Date());

  const totalEntregas = rows.length;
  const asignados = rows.filter((r) => r.estado === "ASIGNADO").length;
  const devueltos = rows.filter((r) => r.estado === "DEVUELTO").length;
  const deptos = new Set(rows.map((r) => r.department)).size;

  const hasFilters = filters && (filters.start || filters.end || filters.department || filters.employee);

  const filterParts: string[] = [];
  if (filters?.start || filters?.end) {
    const from = filters?.start ? fmtFilterDate(filters.start) : "…";
    const to = filters?.end ? fmtFilterDate(filters.end) : "…";
    filterParts.push(`Periodo: ${from} — ${to}`);
  }
  if (filters?.department) filterParts.push(`Departamento: ${filters.department}`);
  if (filters?.employee) filterParts.push(`Empleado: ${filters.employee}`);

  const ROWS_PER_PAGE = 30;
  const pages: ReportRow[][] = [];
  for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
    pages.push(rows.slice(i, i + ROWS_PER_PAGE));
  }

  const COL = {
    fecha: 55,
    folio: 65,
    activo: 60,
    desc: 140,
    resp: 90,
    depto: 80,
    estado: 55,
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
              <View style={styles.headerRight}>
                <Text style={styles.headerDate}>Fecha de generación: {today}</Text>
                <Text style={styles.headerDate}>Página {pageIdx + 1} de {pages.length}</Text>
              </View>
            </View>
          )}

          {pageIdx === 0 && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{totalEntregas}</Text>
                <Text style={styles.summaryLabel}>Total registros</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: "#15803d" }]}>{asignados}</Text>
                <Text style={styles.summaryLabel}>Asignados</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: MUTED }]}>{devueltos}</Text>
                <Text style={styles.summaryLabel}>Devueltos</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: ACCENT }]}>{deptos}</Text>
                <Text style={styles.summaryLabel}>Departamentos</Text>
              </View>
            </View>
          )}

          {pageIdx === 0 && hasFilters && (
            <View style={styles.filterBox}>
              <Text style={styles.filterTitle}>Filtros aplicados</Text>
              <Text style={styles.filterText}>{filterParts.join("  ·  ")}</Text>
            </View>
          )}

          {pageIdx > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: BORDER, borderBottomStyle: "solid" }}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: BRAND }}>{title}</Text>
              <Text style={{ fontSize: 8, color: MUTED }}>Página {pageIdx + 1} de {pages.length}</Text>
            </View>
          )}

          <View style={styles.tableHeader}>
            <View style={{ width: COL.fecha }}><Text style={styles.tableHeaderText}>Fecha</Text></View>
            <View style={{ width: COL.folio }}><Text style={styles.tableHeaderText}>Folio</Text></View>
            <View style={{ width: COL.activo }}><Text style={styles.tableHeaderText}>Activo</Text></View>
            <View style={{ width: COL.desc }}><Text style={styles.tableHeaderText}>Descripción</Text></View>
            <View style={{ width: COL.resp }}><Text style={styles.tableHeaderText}>Responsable</Text></View>
            <View style={{ width: COL.depto }}><Text style={styles.tableHeaderText}>Departamento</Text></View>
            <View style={{ width: COL.estado }}><Text style={styles.tableHeaderText}>Estado</Text></View>
          </View>

          {pageRows.map((r, i) => (
            <View key={r.id + i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <View style={{ width: COL.fecha }}><Text style={styles.cellMuted}>{fmtDate(r.fecha)}</Text></View>
              <View style={{ width: COL.folio }}><Text style={styles.cellBold}>{r.document_code}</Text></View>
              <View style={{ width: COL.activo }}><Text style={styles.cellBold}>{r.asset_code}</Text></View>
              <View style={{ width: COL.desc }}><Text style={styles.cell}>{r.description}</Text></View>
              <View style={{ width: COL.resp }}><Text style={styles.cell}>{r.responsible}</Text></View>
              <View style={{ width: COL.depto }}><Text style={styles.cellMuted}>{r.department}</Text></View>
              <View style={{ width: COL.estado }}>
                <Text style={
                  r.estado === "ASIGNADO" ? styles.badgeAsignado :
                  r.estado === "DEVUELTO" ? styles.badgeDevuelto :
                  r.estado === "PERDIDO" ? styles.badgePerdido :
                  styles.badgeDefault
                }>
                  {r.estado}
                </Text>
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
