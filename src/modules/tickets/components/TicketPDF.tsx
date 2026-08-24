import {
  Document,
  Image,
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
const WHITE = "#ffffff";

const STATUS_COLORS: Record<string, string> = {
  ABIERTO: "#f59e0b",
  EN_SEGUIMIENTO: "#3b82f6",
  CERRADO: "#22c55e",
};

const STATUS_LABELS: Record<string, string> = {
  ABIERTO: "Abierto",
  EN_SEGUIMIENTO: "En seguimiento",
  CERRADO: "Cerrado",
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
    fontSize: 14,
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

  efficacyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 16,
    padding: 10,
    backgroundColor: LIGHT,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  efficacyBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 10,
  },
  efficacyFill: {
    height: 8,
    borderRadius: 4,
  },
  efficacyText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  efficacyLabel: {
    fontSize: 8,
    marginLeft: 6,
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

const formatShortDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatReportDate = (): string => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = now.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

export const TicketPDF = ({ ticket }: Props) => {
  const getEfficacy = () => {
    if (!ticket.closedAt) return null;
    const created = new Date(ticket.creadoEn).getTime();
    const closed = new Date(ticket.closedAt).getTime();
    const hours = (closed - created) / (1000 * 60 * 60);
    const thresholds: Record<string, { excellent: number; good: number; fair: number }> = {
      URGENTE: { excellent: 4, good: 8, fair: 24 },
      ALTA: { excellent: 8, good: 24, fair: 48 },
      MEDIA: { excellent: 24, good: 72, fair: 120 },
      BAJA: { excellent: 72, good: 120, fair: 168 },
    };
    const t = thresholds[ticket.priority] ?? { excellent: 24, good: 72, fair: 120 };
    let score = hours <= t.excellent ? 100 : hours <= t.good ? 80 : hours <= t.fair ? 60 : 40;
    const label = score === 100 ? "Excelente" : score === 80 ? "Bueno" : score === 60 ? "Regular" : "Bajo";
    const color = score === 100 ? "#22c55e" : score === 80 ? "#3b82f6" : score === 60 ? "#f59e0b" : "#ef4444";
    return { score, label, hours: Math.round(hours * 10) / 10, color };
  };

  const efficacy = getEfficacy();
  const today = formatReportDate();

  return (
    <Document title={`Ticket - ${ticket.titulo}`} author="Hotel Puerto Nuevo">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image src="/logo-puerto-nuevo.png" style={styles.logo} />
            <View>
              <Text style={styles.headerTitle}>Reporte de Ticket</Text>
              <Text style={styles.headerSubtitle}>Puerto Nuevo Hotel y Villas</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ ...styles.badge, backgroundColor: STATUS_COLORS[ticket.status] ?? "#64748b" }}>
              {STATUS_LABELS[ticket.status] ?? ticket.status}
            </Text>
            <Text style={styles.headerDate}>Ticket #{ticket.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.headerDate}>Fecha: {today}</Text>
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
                {formatShortDate(ticket.closedAt)}
              </Text>
            </View>
          )}
        </View>

        {efficacy && (
          <View style={styles.efficacyContainer}>
            <View style={styles.efficacyBar}>
              <View style={{ ...styles.efficacyFill, width: `${efficacy.score}%`, backgroundColor: efficacy.color }} />
            </View>
            <Text style={{ ...styles.efficacyText, color: efficacy.color }}>{efficacy.score}%</Text>
            <Text style={{ ...styles.efficacyLabel, color: MUTED }}>{efficacy.label} · {efficacy.hours}h</Text>
          </View>
        )}

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
                  <Text style={{ ...styles.tableCell, flex: 2 }}>{formatDate(c.creadoEn)}</Text>
                  <Text style={{ ...styles.tableCell, flex: 2 }}>{c.autor?.name ?? "—"}</Text>
                  <Text style={{ ...styles.tableCell, flex: 4 }}>{c.texto}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {ticket.history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historial ({ticket.history.length})</Text>
            {ticket.history.map((h) => {
              const isClosed = h.type === "STATUS" && h.detail?.includes("CERRADO");
              const dotColor = isClosed ? "#ef4444" : h.type === "CREATED" ? "#22c55e" : h.type === "ASSIGNED" ? "#8b5cf6" : h.type === "DEPARTMENT" ? "#a855f7" : ACCENT;
              return (
                <View key={h.id} style={styles.historyItem}>
                  <View style={{ ...styles.historyDot, backgroundColor: dotColor }} />
                  <View style={styles.historyContent}>
                    <Text style={{ ...styles.historyTitle, color: isClosed ? "#ef4444" : BRAND }}>
                      {h.detail ?? h.type}
                    </Text>
                    {h.autor && (
                      <Text style={styles.historyDetail}>Por {h.autor.name}</Text>
                    )}
                    <Text style={styles.historyTime}>{formatDate(h.createdAt)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Hotel Puerto Nuevo · Sistema de Tickets</Text>
          <Text style={styles.footerPowered}>powered by axzy.dev</Text>
        </View>
      </Page>
    </Document>
  );
};
