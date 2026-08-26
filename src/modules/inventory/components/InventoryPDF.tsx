import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { InventoryMovement, MovementType } from "@core/api/inventory.api";
import type { Location } from "@core/api/devices.api";

interface Props {
  movements: InventoryMovement[];
  locations: Location[];
}

const BRAND = "#0f172a";
const ACCENT = "#2563eb";
const MUTED = "#64748b";
const LIGHT = "#f1f5f9";
const BORDER = "#e2e8f0";
const WHITE = "#ffffff";

const TIPO_COLORS: Record<MovementType, string> = {
  ENTRADA: "#22c55e",
  SALIDA: "#f59e0b",
  TRASLADO: "#3b82f6",
  BAJA: "#dc2626",
  PRESTAMO: "#a855f7",
  DEVOLUCION: "#14b8a6",
};

const TIPO_LABELS: Record<MovementType, string> = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  TRASLADO: "Traslado",
  BAJA: "Baja",
  PRESTAMO: "Préstamo",
  DEVOLUCION: "Devolución",
};

const formatLocation = (loc?: Location | null): string => {
  if (!loc) return "Sin ubicación";
  const parts = [loc.lugar, loc.subLugar, loc.numero].filter(Boolean);
  return parts.length > 0 ? parts.join("-") : "Ubicación";
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatReportDate = (): string => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = now.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: { width: 52, height: 52 },
  headerRight: {
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 9,
    color: MUTED,
  },
  headerDate: {
    fontSize: 8,
    color: MUTED,
    textAlign: "right",
    marginTop: 4,
  },

  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
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

  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: LIGHT,
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  locationName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },
  locationDesc: {
    fontSize: 8,
    color: MUTED,
    marginTop: 1,
  },
  locationCount: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
  },

  table: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BRAND,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRowAlt: {
    backgroundColor: LIGHT,
  },
  tableCell: {
    fontSize: 8,
    color: "#334155",
  },
  tableCellBold: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
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

const ROWS_PER_PAGE = 25;

export const InventoryPDF = ({ movements, locations }: Props) => {
  const today = formatReportDate();
  const totalDevices = locations.reduce((sum, l) => sum + (l._count?.devices ?? 0), 0);

  const pages: InventoryMovement[][] = [];
  for (let i = 0; i < movements.length; i += ROWS_PER_PAGE) {
    pages.push(movements.slice(i, i + ROWS_PER_PAGE));
  }

  return (
    <Document title="Reporte de Inventario" author="Hotel Puerto Nuevo">
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image src="/logo-puerto-nuevo.png" style={styles.logo} />
            <View>
              <Text style={styles.headerTitle}>Reporte de Inventario</Text>
              <Text style={styles.headerSubtitle}>Puerto Nuevo Hotel y Villas</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerDate}>Fecha: {today}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen por Ubicación</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{locations.length}</Text>
              <Text style={styles.summaryLabel}>Ubicaciones</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{totalDevices}</Text>
              <Text style={styles.summaryLabel}>Dispositivos en ubicación</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{movements.length}</Text>
              <Text style={styles.summaryLabel}>Movimientos</Text>
            </View>
          </View>

          {locations.map((loc) => (
            <View key={loc.id} style={styles.locationCard}>
              <View>
                <Text style={styles.locationName}>{formatLocation(loc)}</Text>
                {loc.descripcion && (
                  <Text style={styles.locationDesc}>{loc.descripcion}</Text>
                )}
              </View>
              <Text style={styles.locationCount}>{loc._count?.devices ?? 0} disp.</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kardex — Historial de Movimientos</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Fecha</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 1.5 }}>Tipo</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Dispositivo</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Ubicación</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 1.5 }}>Usuario</Text>
            </View>
            {movements.slice(0, ROWS_PER_PAGE).map((m, i) => (
              <View key={m.id} style={i % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                <Text style={{ ...styles.tableCell, flex: 2 }}>{formatDate(m.createdAt)}</Text>
                <Text style={{ ...styles.tableCellBold, flex: 1.5, color: TIPO_COLORS[m.tipo] }}>
                  {TIPO_LABELS[m.tipo]}
                </Text>
                <Text style={{ ...styles.tableCellBold, flex: 2 }}>
                  {m.device?.controlActivos ?? "—"}
                </Text>
                <Text style={{ ...styles.tableCell, flex: 2 }}>
                  {m.location ? formatLocation(m.location) : "—"}
                </Text>
                <Text style={{ ...styles.tableCell, flex: 1.5 }}>
                  {m.user?.name ?? "—"}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Hotel Puerto Nuevo · Sistema de Inventario</Text>
          <Text style={styles.footerPowered}>powered by axzy.dev</Text>
        </View>
      </Page>

      {pages.slice(1).map((pageMovements, pageIdx) => (
        <Page key={`page-${pageIdx + 2}`} size="LETTER" style={styles.page}>
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.headerTitle}>Reporte de Inventario (continuación)</Text>
            <Text style={styles.headerSubtitle}>Página {pageIdx + 2}</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Fecha</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 1.5 }}>Tipo</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Dispositivo</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Ubicación</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 1.5 }}>Usuario</Text>
            </View>
            {pageMovements.map((m, i) => (
              <View key={m.id} style={i % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                <Text style={{ ...styles.tableCell, flex: 2 }}>{formatDate(m.createdAt)}</Text>
                <Text style={{ ...styles.tableCellBold, flex: 1.5, color: TIPO_COLORS[m.tipo] }}>
                  {TIPO_LABELS[m.tipo]}
                </Text>
                <Text style={{ ...styles.tableCellBold, flex: 2 }}>
                  {m.device?.controlActivos ?? "—"}
                </Text>
                <Text style={{ ...styles.tableCell, flex: 2 }}>
                  {m.location ? formatLocation(m.location) : "—"}
                </Text>
                <Text style={{ ...styles.tableCell, flex: 1.5 }}>
                  {m.user?.name ?? "—"}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Hotel Puerto Nuevo · Sistema de Inventario</Text>
            <Text style={styles.footerPowered}>powered by axzy.dev</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
};
