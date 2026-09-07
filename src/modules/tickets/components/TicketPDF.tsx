import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Ticket, TicketAssignment } from "@core/api/tickets.api";
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

const PRIORITY_LABELS: Record<string, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

const CATEGORY_LABELS: Record<string, string> = {
  MANTENIMIENTO: "Mantenimiento",
  EQUIPO: "Equipo",
  SISTEMA: "Sistema",
  OTRO: "Otro",
};

const KANBAN_COLS: Array<{
  status: TicketAssignment["status"];
  label: string;
  color: string;
  bg: string;
}> = [
  { status: "PENDIENTE", label: "Pendiente", color: PDF_COLORS.gray, bg: PDF_COLORS.grayBg },
  { status: "EN_PROGRESO", label: "En progreso", color: PDF_COLORS.band, bg: "#bfdbfe" },
  { status: "EN_REVISION", label: "En revisión", color: "#7c3aed", bg: "#ede9fe" },
  { status: "COMPLETADA", label: "Completada", color: PDF_COLORS.success, bg: PDF_COLORS.successBg },
];

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  ticketTitle: { fontSize: 15, fontFamily: "Helvetica-Bold", color: PDF_COLORS.ink, flex: 1 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.white,
  },
  idLine: { fontSize: 8, color: PDF_COLORS.muted, marginBottom: 10 },

  metaRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  metaCard: {
    flex: 1,
    backgroundColor: PDF_COLORS.light,
    borderRadius: 4,
    padding: 8,
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
    marginBottom: 7,
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

  // ── Kanban ──
  kanbanRow: { flexDirection: "row", gap: 8 },
  kanbanCol: {
    flex: 1,
    backgroundColor: PDF_COLORS.light,
    borderRadius: 4,
    padding: 6,
  },
  kanbanColHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  kanbanColTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.ink,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  kanbanCount: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.band,
  },
  kanbanDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  taskCard: {
    backgroundColor: PDF_COLORS.white,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: PDF_COLORS.border,
    padding: 6,
    marginBottom: 5,
  },
  taskEmployee: { fontSize: 8, fontFamily: "Helvetica-Bold", color: PDF_COLORS.ink },
  taskNo: { fontSize: 6.5, color: PDF_COLORS.muted, marginBottom: 3 },
  taskTitleText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: PDF_COLORS.ink, marginBottom: 1 },
  taskText: { fontSize: 7.8, color: "#334155", lineHeight: 1.4 },
  taskDates: { fontSize: 6.8, color: PDF_COLORS.muted, marginTop: 2 },
  emptyCol: {
    fontSize: 7.5,
    color: PDF_COLORS.muted,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
  },

  // ── Historial ──
  historyItem: { flexDirection: "row", gap: 8, marginBottom: 8 },
  historyDot: { width: 7, height: 7, borderRadius: 3.5, marginTop: 2 },
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

const dotColorFor = (type: string, detail?: string | null) => {
  if (type === "STATUS" && detail?.includes("CERRADO")) return PDF_COLORS.success;
  if (type === "CREATED") return PDF_COLORS.success;
  if (type === "ASSIGNED") return "#8b5cf6";
  if (type === "DEPARTMENT") return "#a855f7";
  if (type === "DELETED") return PDF_COLORS.danger;
  return PDF_COLORS.band;
};

export const TicketPDF = ({ ticket }: Props) => {
  const today = formatReportDate();

  // Historial + comentarios en una sola línea de tiempo cronológica.
  const timeline: Array<{
    id: string;
    ts: string;
    title: string;
    detail?: string;
    author?: string;
    dot: string;
  }> = [];
  ticket.history.forEach((h) => {
    timeline.push({
      id: h.id,
      ts: h.createdAt,
      title: h.detail ?? h.type,
      detail: h.autor?.name ? `Por ${h.autor.name}` : undefined,
      dot: dotColorFor(h.type, h.detail),
    });
  });
  ticket.comments.forEach((c) => {
    timeline.push({
      id: c.id,
      ts: c.creadoEn,
      title: `Comentario de ${c.autor?.name ?? "Usuario"}`,
      detail: c.texto,
      dot: PDF_COLORS.gray,
    });
  });
  timeline.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  const cols = KANBAN_COLS.map((col) => ({
    ...col,
    items: ticket.assignments.filter((a) => a.status === col.status),
  }));

  return (
    <Document title={`Ticket - ${ticket.titulo}`} author="Puerto Nuevo Hotel y Villas">
      <Page size="A4" style={pdfTheme.page}>
        <PdfLetterhead title="Reporte de Ticket" pageIndex={0} pageCount={1} generatedAt={today} />

        <View style={pdfTheme.content}>
          {/* ── Encabezado ── */}
          <View style={styles.titleRow}>
            <Text style={styles.ticketTitle}>{ticket.titulo}</Text>
            <Text style={{ ...styles.statusBadge, backgroundColor: STATUS_COLORS[ticket.status] ?? PDF_COLORS.gray }}>
              {STATUS_LABELS[ticket.status] ?? ticket.status}
            </Text>
          </View>
          <Text style={styles.idLine}>
            Ticket #{ticket.id.slice(0, 8).toUpperCase()} · Creado {formatShortDate(ticket.creadoEn)}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Prioridad</Text>
              <Text style={styles.metaValue}>{PRIORITY_LABELS[ticket.priority] ?? ticket.priority}</Text>
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
            {ticket.closedAt ? (
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>Cerrado</Text>
                <Text style={{ ...styles.metaValue, color: PDF_COLORS.success }}>
                  {formatShortDate(ticket.closedAt)}
                </Text>
              </View>
            ) : (
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>Tareas</Text>
                <Text style={styles.metaValue}>
                  {ticket.assignments.filter((a) => a.status === "COMPLETADA").length}/{ticket.assignments.length}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>{ticket.descripcion}</Text>
          </View>

          {/* ── Tablero kanban ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Tablero de tareas ({ticket.assignments.length})
            </Text>
            {ticket.assignments.length === 0 ? (
              <Text style={styles.emptyCol}>Sin tareas asignadas a este ticket.</Text>
            ) : (
              <View style={styles.kanbanRow}>
                {cols.map((col) => (
                  <View key={col.status} style={styles.kanbanCol}>
                    <View style={styles.kanbanColHeader}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={{ ...styles.kanbanDot, backgroundColor: col.color }} />
                        <Text style={styles.kanbanColTitle}>{col.label}</Text>
                      </View>
                      <Text style={styles.kanbanCount}>{col.items.length}</Text>
                    </View>
                    {col.items.length === 0 ? (
                      <Text style={styles.emptyCol}>Sin tareas</Text>
                    ) : (
                      col.items.map((a) => (
                        <View key={a.id} style={styles.taskCard}>
                          <Text style={styles.taskEmployee}>{a.user.name}</Text>
                          <Text style={styles.taskNo}>
                            {a.user.numeroEmpleado ? `No. ${a.user.numeroEmpleado}` : ""}
                          </Text>
                          <Text style={{ ...styles.taskTitleText }}>{a.title}</Text>
                          {a.description ? (
                            <Text style={styles.taskText}>{a.description}</Text>
                          ) : null}
                          {a.dueDate && a.status !== "COMPLETADA" && new Date(a.dueDate) < new Date() && (
                            <Text style={{ ...styles.taskText, color: PDF_COLORS.danger, fontFamily: "Helvetica-Bold" }}>
                              Vencida
                            </Text>
                          )}
                          {(a.startDate || a.dueDate) && (
                            <Text style={styles.taskDates}>
                              {a.startDate ? `Inicio ${formatShortDate(a.startDate)}` : ""}
                              {a.startDate && a.dueDate ? " · " : ""}
                              {a.dueDate ? `Fin ${formatShortDate(a.dueDate)}` : ""}
                            </Text>
                          )}
                          {a.comments && a.comments.length > 0 && (
                            <Text style={styles.taskDates}>
                              {a.comments.length} comentario(s)
                            </Text>
                          )}
                        </View>
                      ))
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── Historial ── */}
          {timeline.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Historial ({timeline.length})</Text>
              {timeline.map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <View style={{ ...styles.historyDot, backgroundColor: item.dot }} />
                  <View style={styles.historyContent}>
                    <Text style={styles.historyTitle}>{item.title}</Text>
                    {item.detail && <Text style={styles.historyDetail}>{item.detail}</Text>}
                    <Text style={styles.historyTime}>{formatDate(item.ts)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <PdfFooter pageIndex={0} pageCount={1} note="Puerto Nuevo Hotel y Villas — Sistema de Tickets" />
      </Page>
    </Document>
  );
};