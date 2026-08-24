import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  Image,
} from "@react-pdf/renderer";
import type { ReportRow } from "@core/api/reports.api";
import { CommonHeader, CommonFooter } from "@modules/shared/components/pdf/CommonPDF";

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

const BRAND = "#1e3a5f";
const ACCENT = "#2563eb";
const MUTED = "#64748b";
const LIGHT = "#f8fafc";
const BORDER = "#e2e8f0";
const WHITE = "#ffffff";
const GOLD = "#c9a84c";

const styles = StyleSheet.create({
  page: {
    backgroundColor: WHITE,
    fontFamily: "Helvetica",
    fontSize: 9,
  },
  pageContent: {
    padding: 0,
  },

  /* ── Body ── */
  body: {
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 60,
  },

  /* ── Summary Cards ── */
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: LIGHT,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  /* ── Filter Info ── */
  filterBox: {
    backgroundColor: LIGHT,
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  filterTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  filterText: {
    fontSize: 9,
    color: "#475569",
  },

  /* ── Section Header ── */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: GOLD,
    marginLeft: 12,
  },

  /* ── Table ── */
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BRAND,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  tableRowAlt: {
    backgroundColor: LIGHT,
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

  /* ── Badges ── */
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
    color: MUTED,
    backgroundColor: LIGHT,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },

  /* ── Mini Header (subsequent pages) ── */
  miniHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  miniTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },
  miniPage: {
    fontSize: 8,
    color: MUTED,
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
    filterParts.push(`Período: ${from} — ${to}`);
  }
  if (filters?.department) filterParts.push(`Departamento: ${filters.department}`);
  if (filters?.employee) filterParts.push(`Empleado: ${filters.employee}`);

  const ROWS_PER_PAGE = 28;
  const pages: ReportRow[][] = [];
  for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
    pages.push(rows.slice(i, i + ROWS_PER_PAGE));
  }
  const totalPages = pages.length;

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
    <Document title={title} author="Hotel Puerto Nuevo">
      {pages.map((pageRows, pageIdx) => (
        <Page key={pageIdx} size="LETTER" style={styles.page}>
          <View style={styles.pageContent}>
            <CommonHeader
              title={title}
              subtitle="Reporte de Entregas"
              meta={`Generado: ${today}`}
              pageNumber={pageIdx + 1}
              totalPages={totalPages}
            />

            <View style={styles.body}>
              {pageIdx === 0 && (
                <>
                  {/* ── Summary Cards ── */}
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

                  {/* ── Filters Applied ── */}
                  {hasFilters && (
                    <View style={styles.filterBox}>
                      <Text style={styles.filterTitle}>Filtros aplicados</Text>
                      <Text style={styles.filterText}>{filterParts.join("  ·  ")}</Text>
                    </View>
                  )}
                </>
              )}

              {pageIdx > 0 && (
                <View style={styles.miniHeader}>
                  <Text style={styles.miniTitle}>{title}</Text>
                  <Text style={styles.miniPage}>Página {pageIdx + 1} de {totalPages}</Text>
                </View>
              )}

              {/* ── Section Header ── */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Detalle de Entregas</Text>
                <View style={styles.sectionLine} />
              </View>

              {/* ── Table ── */}
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
                    <Text style={r.estado === "DEVUELTO" ? styles.badgeDevuelto : styles.badgeAsignado}>
                      {r.estado}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <CommonFooter />
          </View>
        </Page>
      ))}
    </Document>
  );
}
