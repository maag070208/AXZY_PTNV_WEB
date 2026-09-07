import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Ticket } from "@core/api/tickets.api";
import { PDF_COLORS, pdfTheme } from "@core/pdf/theme";
import PdfLetterhead from "@core/pdf/PdfLetterhead";
import PdfFooter from "@core/pdf/PdfFooter";

interface Props {
  ticket: Ticket;
}

const STATUS_COLORS: Record<string, string> = {
  ABIERTO: PDF_COLORS.warning,
  EN_SEGUIMIENTO: PDF_COLORS.band,
  CERRADO: PDF_COLORS.success,
};

const STATUS_LABELS: Record<string, string> = {
  ABIERTO: "Abierto",
  EN_SEGUIMIENTO: "En seguimiento",
  CERRADO: "Cerrado",
};

const PRIORITY_COLORS: Record<string, string> = {
  BAJA: PDF_COLORS.muted,
  MEDIA: PDF_COLORS.warning,
  ALTA: "#ef4444",
  URGENTE: PDF_COLORS.danger,
};

const CATEGORY_LABELS: Record<string, string> = {
  MANTENIMIENTO: "Mantenimiento",
  EQUIPO: "Equipo",
  SISTEMA: "Sistema",
  OTRO: "Otro",
};

const styles = StyleSheet.create({
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.white,
    overflow: "hidden",
  },
  metaRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  metaCard: {
    flex: 1,
    backgroundColor: PDF_COLORS.light,
    borderRadius: 4,
    padding: 8,
    borderTopWidth: 2,
    borderTopColor: PDF_COLORS.band,
  },
  metaLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  metaValue: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: PDF_COLORS.ink },

  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
  },
  description: {
    fontSize: 9,
    color: "#334155",
    lineHeight: 1.5,
    backgroundColor: PDF_COLORS.light,
    padding: 10,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: PDF_COLORS.band,
  },

  efficacyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    padding: 9,
    backgroundColor: PDF_COLORS.light,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: PDF_COLORS.border,
  },
  efficacyBar: {
    flex: 1,
    height: 7,
    backgroundColor: PDF_COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 10,
  },
  efficacyFill: { height: 7, borderRadius: 4 },
  efficacyText: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  efficacyLabel: { fontSize: 7.5, marginLeft: 6 },

  historyItem: { flexDirection: "row", gap: 8, marginBottom: 9 },
  historyDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: PDF_COLORS.band, marginTop: 2 },
  historyContent: { flex: 1 },
  historyTitle: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: PDF_COLORS.ink },
  historyDetail: { fontSize: 7.5, color: PDF_COLORS.muted, marginTop: 1, lineHeight: 1.4 },
  historyTime: { fontSize: 6.8, color: PDF_COLORS.muted, marginTop: 2 },
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
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
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
    const score = hours <= t.excellent ? 100 : hours <= t.good ? 80 : hours <= t.fair ? 60 : 40;
    const label = score === 100 ? "Excelente" : score === 80 ? "Bueno" : score === 60 ? "Regular" : "Bajo";
    const color = score === 100 ? PDF_COLORS.success : score === 80 ? PDF_COLORS.band : score === 60 ? PDF_COLORS.warning : PDF_COLORS.danger;
    return { score, label, hours: Math.round(hours * 10) / 10, color };
  };

  const efficacy = getEfficacy();
  const today = formatReportDate();

  return (
    <Document title={`Ticket - ${ticket.titulo}`} author="Puerto Nuevo Hotel y Villas">
      <Page size="A4" style={pdfTheme.page}>
        <PdfLetterhead title="Reporte de Ticket" pageIndex={0} pageCount={1} generatedAt={today} />

        <View style={pdfTheme.content}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <Text style={{ fontSize: 8.5, color: PDF_COLORS.muted }}>
              Ticket <Text style={{ fontFamily: "Helvetica-Bold", color: PDF_COLORS.ink }}>#{ticket.id.slice(0, 8).toUpperCase()}</Text>
            </Text>
            <Text style={{ ...styles.statusBadge, backgroundColor: STATUS_COLORS[ticket.status] ?? PDF_COLORS.gray }}>
              {STATUS_LABELS[ticket.status] ?? ticket.status}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Prioridad</Text>
              <Text style={{ ...styles.metaValue, color: PRIORITY_COLORS[ticket.priority] ?? PDF_COLORS.ink }}>
                {ticket.priority}
              </Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Categoría</Text>
              <Text style={styles.metaValue}>{CATEGORY_LABELS[ticket.category] ?? ticket.category}</Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Departamento</Text>
              <Text style={styles.metaValue}>{ticket.department?.name ?? "—"}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Creado por</Text>
              <Text style={styles.metaValue}>{ticket.creadoPor?.name ?? "—"}</Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Asignado a</Text>
              <Text style={styles.metaValue}>{ticket.asignadoA?.name ?? "Sin asignar"}</Text>
            </View>
            {ticket.closedAt && (
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>Cerrado</Text>
                <Text style={{ ...styles.metaValue, color: PDF_COLORS.success }}>
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
              <Text style={{ ...styles.efficacyLabel, color: PDF_COLORS.muted }}>
                {efficacy.label} · {efficacy.hours}h
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>{ticket.descripcion}</Text>
          </View>

          {ticket.comments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Comentarios ({ticket.comments.length})</Text>
              <View style={pdfTheme.tableHeader}>
                <Text style={{ ...pdfTheme.tableHeaderText, flex: 2 }}>Fecha</Text>
                <Text style={{ ...pdfTheme.tableHeaderText, flex: 2 }}>Autor</Text>
                <Text style={{ ...pdfTheme.tableHeaderText, flex: 4 }}>Comentario</Text>
              </View>
              {ticket.comments.map((c, i) => (
                <View key={c.id} style={i % 2 === 1 ? pdfTheme.tableRowAlt : pdfTheme.tableRow}>
                  <Text style={{ ...pdfTheme.cellMuted, flex: 2 }}>{formatDate(c.creadoEn)}</Text>
                  <Text style={{ ...pdfTheme.cell, flex: 2 }}>{c.autor?.name ?? "—"}</Text>
                  <Text style={{ ...pdfTheme.cell, flex: 4 }}>{c.texto}</Text>
                </View>
              ))}
            </View>
          )}

          {ticket.history.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Historial ({ticket.history.length})</Text>
              {ticket.history.map((h) => {
                const isClosed = h.type === "STATUS" && h.detail?.includes("CERRADO");
                const dotColor = isClosed
                  ? PDF_COLORS.danger
                  : h.type === "CREATED"
                  ? PDF_COLORS.success
                  : h.type === "ASSIGNED"
                  ? "#8b5cf6"
                  : h.type === "DEPARTMENT"
                  ? "#a855f7"
                  : PDF_COLORS.band;
                return (
                  <View key={h.id} style={styles.historyItem}>
                    <View style={{ ...styles.historyDot, backgroundColor: dotColor }} />
                    <View style={styles.historyContent}>
                      <Text style={{ ...styles.historyTitle, color: isClosed ? PDF_COLORS.danger : PDF_COLORS.ink }}>
                        {h.detail ?? h.type}
                      </Text>
                      {h.autor && <Text style={styles.historyDetail}>Por {h.autor.name}</Text>}
                      <Text style={styles.historyTime}>{formatDate(h.createdAt)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <PdfFooter pageIndex={0} pageCount={1} note="Puerto Nuevo Hotel y Villas — Sistema de Tickets" />
      </Page>
    </Document>
  );
};
