import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Ticket } from "@core/api/tickets.api";

interface Props {
  ticket: Ticket;
}

const BRAND = "#0f172a";
const ACCENT = "#2563eb";
const MUTED = "#64748b";
const LIGHT = "#f1f5f9";
const BORDER = "#e2e8f0";

const STATUS_COLORS: Record<string, string> = {
  ABIERTO: "#f59e0b",
  EN_SEGUIMIENTO: "#3b82f6",
  CERRADO: "#22c55e",
};

const PRIORITY_COLORS: Record<string, string> = {
  BAJA: "#94a3b8",
  MEDIA: "#f59e0b",
  ALTA: "#ef4444",
  URGENTE: "#dc2626",
};

const CATEGORY_LABELS: Record<string, string> = {
  MANTENIMIENTO: "Mantenimiento",
  EQUIPO: "Equipo",
  SISTEMA: "Sistema",
  OTRO: "Otro",
};

const STATUS_LABELS: Record<string, string> = {
  ABIERTO: "Abierto",
  EN_SEGUIMIENTO: "En seguimiento",
  CERRADO: "Cerrado",
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
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
    overflow: "hidden",
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  metaCard: {
    flex: 1,
    backgroundColor: LIGHT,
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  metaLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  description: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.6,
    backgroundColor: LIGHT,
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
  },
  table: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BRAND,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 8,
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
    fontSize: 9,
    color: "#334155",
  },
  historyItem: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
    marginTop: 2,
  },
  historyLine: {
    width: 1,
    backgroundColor: BORDER,
    marginLeft: 3,
    flex: 1,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },
  historyDetail: {
    fontSize: 8,
    color: MUTED,
    marginTop: 1,
    lineHeight: 1.4,
  },
  historyTime: {
    fontSize: 7,
    color: MUTED,
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: MUTED,
  },
  noData: {
    fontSize: 9,
    color: MUTED,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 16,
  },
});

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

export const TicketPDF = ({ ticket }: Props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{ticket.titulo}</Text>
          <Text style={styles.headerSubtitle}>
            Ticket #{ticket.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={{ ...styles.badge, backgroundColor: STATUS_COLORS[ticket.status] ?? "#64748b" }}>
            {STATUS_LABELS[ticket.status] ?? ticket.status}
          </Text>
          <Text style={styles.headerDate}>Creado: {formatDate(ticket.creadoEn)}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Prioridad</Text>
          <Text style={{ ...styles.metaValue, color: PRIORITY_COLORS[ticket.priority] ?? BRAND }}>
            {ticket.priority}
          </Text>
        </View>
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Categoría</Text>
          <Text style={styles.metaValue}>
            {CATEGORY_LABELS[ticket.category] ?? ticket.category}
          </Text>
        </View>
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Departamento</Text>
          <Text style={styles.metaValue}>
            {ticket.department?.name ?? "—"}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Creado por</Text>
          <Text style={styles.metaValue}>{ticket.creadoPor?.name ?? "—"}</Text>
        </View>
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Asignado a</Text>
          <Text style={styles.metaValue}>
            {ticket.asignadoA?.name ?? "Sin asignar"}
          </Text>
        </View>
        {ticket.closedAt && (
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Cerrado</Text>
            <Text style={{ ...styles.metaValue, color: "#22c55e" }}>
              {formatDate(ticket.closedAt)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.description}>{ticket.descripcion}</Text>
      </View>

      {ticket.comments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comentarios ({ticket.comments.length})</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Fecha</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Autor</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 4 }}>Comentario</Text>
            </View>
            {ticket.comments.map((c, i) => (
              <View key={c.id} style={i % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                <Text style={{ ...styles.tableCell, flex: 2 }}>
                  {formatDate(c.creadoEn)}
                </Text>
                <Text style={{ ...styles.tableCell, flex: 2 }}>
                  {c.autor?.name ?? "—"}
                </Text>
                <Text style={{ ...styles.tableCell, flex: 4 }}>
                  {c.texto}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {ticket.history.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial ({ticket.history.length})</Text>
          {ticket.history.map((h) => (
            <View key={h.id} style={styles.historyItem}>
              <View style={styles.historyDot} />
              <View style={styles.historyContent}>
                <Text style={styles.historyTitle}>
                  {h.detail ?? h.type}
                </Text>
                {h.autor && (
                  <Text style={styles.historyDetail}>
                    Por {h.autor.name}
                  </Text>
                )}
                <Text style={styles.historyTime}>
                  {formatDate(h.createdAt)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Hotel Puerto Nuevo · Sistema de Tickets
        </Text>
        <Text style={styles.footerText}>
          Generado: {formatDate(new Date().toISOString())}
        </Text>
      </View>
    </Page>
  </Document>
);
