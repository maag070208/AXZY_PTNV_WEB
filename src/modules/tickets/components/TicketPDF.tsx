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

const NAVY = "#1e3a5f";
const NAVY_DARK = "#0f2744";
const GOLD = "#c9a84c";
const GOLD_LIGHT = "#f5e6c8";
const WHITE = "#ffffff";
const SLATE = "#64748b";
const SLATE_LIGHT = "#94a3b8";
const BORDER = "#e2e8f0";
const LIGHT = "#f8fafc";
const DARK_TEXT = "#1e293b";
const MID_TEXT = "#475569";

const STATUS_COLORS: Record<string, string> = {
  ABIERTO: "#d97706",
  EN_SEGUIMIENTO: "#2563eb",
  CERRADO: "#16a34a",
};

const STATUS_LABELS: Record<string, string> = {
  ABIERTO: "Abierto",
  EN_SEGUIMIENTO: "En seguimiento",
  CERRADO: "Cerrado",
};

const PRIORITY_COLORS: Record<string, string> = {
  BAJA: "#64748b",
  MEDIA: "#d97706",
  ALTA: "#dc2626",
  URGENTE: "#991b1b",
};

const CATEGORY_LABELS: Record<string, string> = {
  MANTENIMIENTO: "Mantenimiento",
  EQUIPO: "Equipo",
  SISTEMA: "Sistema",
  OTRO: "Otro",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: WHITE,
    fontFamily: "Helvetica",
  },
  pageContent: {
    padding: 0,
  },

  /* ── Header ── */
  headerBlock: {
    backgroundColor: NAVY,
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 40,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  logoArea: {
    flexDirection: "column",
  },
  logoText: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    letterSpacing: 0.5,
  },
  logoSubtext: {
    fontSize: 8,
    color: GOLD,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 2,
  },
  ticketId: {
    fontSize: 9,
    color: GOLD,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  headerDivider: {
    height: 2,
    backgroundColor: GOLD,
    marginBottom: 20,
  },
  ticketTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    marginBottom: 8,
    lineHeight: 1.3,
  },
  headerMeta: {
    flexDirection: "row",
    gap: 20,
  },
  headerMetaItem: {
    flexDirection: "column",
  },
  headerMetaLabel: {
    fontSize: 7,
    color: SLATE_LIGHT,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  headerMetaValue: {
    fontSize: 10,
    color: WHITE,
    fontFamily: "Helvetica-Bold",
  },

  /* ── Status Banner ── */
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 40,
    backgroundColor: LIGHT,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 16,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    textTransform: "uppercase",
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    backgroundColor: NAVY,
  },
  categoryText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    textTransform: "uppercase",
  },
  statusMeta: {
    flexDirection: "row",
    gap: 20,
    marginLeft: "auto",
  },
  statusMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusMetaLabel: {
    fontSize: 8,
    color: SLATE,
  },
  statusMetaValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK_TEXT,
  },

  /* ── Body ── */
  body: {
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 40,
  },

  /* ── KPI Cards ── */
  kpiRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: LIGHT,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
  },
  kpiLabel: {
    fontSize: 7,
    color: SLATE,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: DARK_TEXT,
  },
  kpiSub: {
    fontSize: 8,
    color: SLATE,
    marginTop: 2,
  },

  /* ── Efficacy ── */
  efficacySection: {
    marginBottom: 24,
  },
  efficacyCard: {
    backgroundColor: LIGHT,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  efficacyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  efficacyTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK_TEXT,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  efficacyScore: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  efficacyNumber: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
  },
  efficacyLabel: {
    fontSize: 10,
  },
  efficacyBarBg: {
    height: 8,
    backgroundColor: BORDER,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  efficacyBarFill: {
    height: 8,
    borderRadius: 4,
  },
  efficacyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  efficacyDetail: {
    fontSize: 8,
    color: SLATE,
  },

  /* ── Section ── */
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: GOLD,
    marginLeft: 12,
  },

  /* ── Description ── */
  descriptionBox: {
    backgroundColor: LIGHT,
    borderRadius: 6,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: NAVY,
  },
  descriptionText: {
    fontSize: 10,
    color: MID_TEXT,
    lineHeight: 1.7,
  },

  /* ── Info Grid ── */
  infoGrid: {
    flexDirection: "row",
    gap: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: LIGHT,
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  infoLabel: {
    fontSize: 7,
    color: SLATE,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: DARK_TEXT,
    marginBottom: 2,
  },
  infoSub: {
    fontSize: 8,
    color: SLATE,
  },

  /* ── Comments Table ── */
  table: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: NAVY,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRowAlt: {
    backgroundColor: LIGHT,
  },
  tableCell: {
    fontSize: 9,
    color: MID_TEXT,
  },
  tableCellBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK_TEXT,
  },

  /* ── Timeline ── */
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 0,
  },
  timelineLeft: {
    alignItems: "center",
    width: 30,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: BORDER,
    marginTop: 4,
    marginBottom: -8,
  },
  timelineContent: {
    flex: 1,
    flexDirection: "row",
    paddingBottom: 16,
    paddingLeft: 8,
    borderLeftWidth: 0,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: LIGHT,
    borderRadius: 6,
    padding: 10,
    borderLeftWidth: 3,
  },
  timelineCardTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK_TEXT,
    marginBottom: 2,
  },
  timelineCardMeta: {
    fontSize: 8,
    color: SLATE,
    marginBottom: 2,
  },
  timelineCardTime: {
    fontSize: 7,
    color: SLATE_LIGHT,
  },

  /* ── Footer ── */
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: NAVY_DARK,
    paddingVertical: 12,
    paddingHorizontal: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerLogo: {
    width: 12,
    height: 12,
    backgroundColor: GOLD,
    borderRadius: 2,
  },
  footerText: {
    fontSize: 8,
    color: SLATE_LIGHT,
  },
  footerRight: {
    alignItems: "flex-end",
  },
  footerDate: {
    fontSize: 8,
    color: SLATE_LIGHT,
  },
  footerConf: {
    fontSize: 7,
    color: GOLD,
    marginTop: 1,
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
    const color = score === 100 ? "#16a34a" : score === 80 ? "#2563eb" : score === 60 ? "#d97706" : "#dc2626";
    return { score, label, hours: Math.round(hours * 10) / 10, color };
  };

  const efficacy = getEfficacy();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.pageContent}>
          {/* Header */}
          <View style={styles.headerBlock}>
            <View style={styles.headerTop}>
              <View style={styles.logoArea}>
                <Text style={styles.logoText}>Puerto Nuevo</Text>
                <Text style={styles.logoSubtext}>Hotel & Villas</Text>
              </View>
              <Text style={styles.ticketId}>
                TICKET #{ticket.id.slice(0, 8).toUpperCase()}
              </Text>
            </View>
            <View style={styles.headerDivider} />
            <Text style={styles.ticketTitle}>{ticket.titulo}</Text>
            <View style={styles.headerMeta}>
              <View style={styles.headerMetaItem}>
                <Text style={styles.headerMetaLabel}>Creado</Text>
                <Text style={styles.headerMetaValue}>{formatShortDate(ticket.creadoEn)}</Text>
              </View>
              <View style={styles.headerMetaItem}>
                <Text style={styles.headerMetaLabel}>Departamento</Text>
                <Text style={styles.headerMetaValue}>
                  {ticket.department?.name ?? "Sin asignar"}
                </Text>
              </View>
              <View style={styles.headerMetaItem}>
                <Text style={styles.headerMetaLabel}>Reporta</Text>
                <Text style={styles.headerMetaValue}>{ticket.creadoPor?.name ?? "—"}</Text>
              </View>
            </View>
          </View>

          {/* Status Banner */}
          <View style={styles.statusBanner}>
            <View style={{ ...styles.statusBadge, backgroundColor: STATUS_COLORS[ticket.status] ?? SLATE }}>
              <View style={{ ...styles.statusDot, backgroundColor: WHITE }} />
              <Text style={styles.statusText}>{STATUS_LABELS[ticket.status] ?? ticket.status}</Text>
            </View>
            <View style={{ ...styles.priorityBadge, backgroundColor: PRIORITY_COLORS[ticket.priority] ?? SLATE }}>
              <Text style={styles.priorityText}>{ticket.priority}</Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{CATEGORY_LABELS[ticket.category] ?? ticket.category}</Text>
            </View>
            <View style={styles.statusMeta}>
              <View style={styles.statusMetaItem}>
                <Text style={styles.statusMetaLabel}>Creado:</Text>
                <Text style={styles.statusMetaValue}>{formatShortDate(ticket.creadoEn)}</Text>
              </View>
              {ticket.closedAt && (
                <View style={styles.statusMetaItem}>
                  <Text style={styles.statusMetaLabel}>Cerrado:</Text>
                  <Text style={styles.statusMetaValue}>{formatShortDate(ticket.closedAt)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {/* KPI Row */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Creado por</Text>
                <Text style={styles.kpiValue}>{ticket.creadoPor?.name ?? "—"}</Text>
                <Text style={styles.kpiSub}>{ticket.creadoPor?.puesto ?? "Empleado"}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Asignado a</Text>
                <Text style={styles.kpiValue}>{ticket.asignadoA?.name ?? "Sin asignar"}</Text>
                <Text style={styles.kpiSub}>{ticket.asignadoA?.puesto ?? "—"}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Comentarios</Text>
                <Text style={styles.kpiValue}>{ticket.comments.length}</Text>
                <Text style={styles.kpiSub}>Interacciones</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Eventos</Text>
                <Text style={styles.kpiValue}>{ticket.history.length}</Text>
                <Text style={styles.kpiSub}>Cambios registrados</Text>
              </View>
            </View>

            {/* Efficacy */}
            {efficacy && (
              <View style={styles.efficacySection}>
                <View style={styles.efficacyCard}>
                  <View style={styles.efficacyHeader}>
                    <Text style={styles.efficacyTitle}>Índice de Eficacia</Text>
                    <View style={styles.efficacyScore}>
                      <Text style={{ ...styles.efficacyNumber, color: efficacy.color }}>
                        {efficacy.score}%
                      </Text>
                      <Text style={{ ...styles.efficacyLabel, color: efficacy.color }}>
                        {efficacy.label}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.efficacyBarBg}>
                    <View style={{ ...styles.efficacyBarFill, width: `${efficacy.score}%`, backgroundColor: efficacy.color }} />
                  </View>
                  <View style={styles.efficacyFooter}>
                    <Text style={styles.efficacyDetail}>
                      Tiempo de resolución: {efficacy.hours} horas
                    </Text>
                    <Text style={styles.efficacyDetail}>
                      Prioridad: {ticket.priority}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Description */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Descripción del Ticket</Text>
                <View style={styles.sectionLine} />
              </View>
              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>{ticket.descripcion}</Text>
              </View>
            </View>

            {/* Comments */}
            {ticket.comments.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Comentarios y Seguimiento</Text>
                  <View style={styles.sectionLine} />
                </View>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Fecha</Text>
                    <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Autor</Text>
                    <Text style={{ ...styles.tableHeaderCell, flex: 4 }}>Comentario</Text>
                  </View>
                  {ticket.comments.map((c, i) => (
                    <View key={c.id} style={i % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                      <Text style={{ ...styles.tableCell, flex: 2 }}>{formatDate(c.creadoEn)}</Text>
                      <Text style={{ ...styles.tableCellBold, flex: 2 }}>{c.autor?.name ?? "—"}</Text>
                      <Text style={{ ...styles.tableCell, flex: 4 }}>{c.texto}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Timeline / History */}
            {ticket.history.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Historial de Actividad</Text>
                  <View style={styles.sectionLine} />
                </View>
                <View style={styles.timeline}>
                  {ticket.history.map((h, idx) => {
                    const isClosed = h.type === "STATUS" && h.detail?.includes("CERRADO");
                    const dotColor = isClosed ? "#dc2626" : h.type === "CREATED" ? "#16a34a" : h.type === "ASSIGNED" ? "#7c3aed" : h.type === "DEPARTMENT" ? "#9333ea" : h.type === "PRIORITY" ? "#d97706" : NAVY;
                    const borderColor = isClosed ? "#dc2626" : h.type === "CREATED" ? "#16a34a" : h.type === "ASSIGNED" ? "#7c3aed" : h.type === "DEPARTMENT" ? "#9333ea" : h.type === "PRIORITY" ? "#d97706" : NAVY;
                    return (
                      <View key={h.id} style={styles.timelineItem}>
                        <View style={styles.timelineLeft}>
                          <View style={{ ...styles.timelineDot, backgroundColor: dotColor }} />
                          {idx < ticket.history.length - 1 && <View style={styles.timelineLine} />}
                        </View>
                        <View style={styles.timelineContent}>
                          <View style={{ ...styles.timelineCard, borderLeftColor: borderColor }}>
                            <Text style={styles.timelineCardTitle}>
                              {h.detail ?? h.type}
                            </Text>
                            {h.autor && (
                              <Text style={styles.timelineCardMeta}>
                                Por {h.autor.name}
                              </Text>
                            )}
                            <Text style={styles.timelineCardTime}>
                              {formatDate(h.createdAt)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer} fixed>
            <View style={styles.footerLeft}>
              <View style={styles.footerLogo} />
              <Text style={styles.footerText}>Hotel Puerto Nuevo · Sistema de Tickets</Text>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.footerDate}>
                Generado el {formatDate(new Date().toISOString())}
              </Text>
              <Text style={styles.footerConf}>Documento confidencial</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
