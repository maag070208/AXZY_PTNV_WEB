import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n/dyn";
import type { Ticket, TicketAssignment, TicketAttachment } from "@entities/ticket";
import { PDF_COLORS, pdfTheme } from "@shared/pdf/theme";
import PdfLetterhead from "@shared/pdf/PdfLetterhead";
import PdfFooter from "@shared/pdf/PdfFooter";
import { formatDate as fmtDate } from "@shared/i18n";

interface Props {
  ticket: Ticket;
  attachments?: Array<TicketAttachment & { dataUrl?: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  ABIERTO: PDF_COLORS.warning,
  EN_SEGUIMIENTO: PDF_COLORS.band,
  CERRADO: PDF_COLORS.success,
};

const KANBAN_COLS: Array<{
  status: TicketAssignment["status"];
  color: string;
  bg: string;
}> = [
  { status: "PENDIENTE", color: PDF_COLORS.gray, bg: PDF_COLORS.grayBg },
  { status: "EN_PROGRESO", color: PDF_COLORS.band, bg: "#bfdbfe" },
  { status: "EN_REVISION", color: "#7c3aed", bg: "#ede9fe" },
  { status: "COMPLETADA", color: PDF_COLORS.success, bg: PDF_COLORS.successBg },
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
  kanbanRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 8,
  },
  kanbanCol: {
    width: "23.5%",
    alignSelf: "flex-start",
    backgroundColor: PDF_COLORS.light,
    borderRadius: 4,
    padding: 7,
    borderTopWidth: 2,
  },
  kanbanColHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  kanbanColTitle: {
    fontSize: 7,
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
    padding: 7,
    marginBottom: 5,
  },
  taskEmployee: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: PDF_COLORS.ink },
  taskNo: { fontSize: 6, color: PDF_COLORS.muted, marginBottom: 3 },
  taskTitleText: { fontSize: 7.7, fontFamily: "Helvetica-Bold", color: PDF_COLORS.ink, marginBottom: 1 },
  taskText: { fontSize: 7.2, color: "#334155", lineHeight: 1.35 },
  taskDates: { fontSize: 6.4, color: PDF_COLORS.muted, marginTop: 2 },
  emptyCol: {
    fontSize: 7.5,
    color: PDF_COLORS.muted,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 7,
  },

  // ── Historial ──
  historyItem: { flexDirection: "row", gap: 8, marginBottom: 8 },
  historyDot: { width: 7, height: 7, borderRadius: 3.5, marginTop: 2 },
  historyContent: { flex: 1 },
  historyTitle: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: PDF_COLORS.ink },
  historyDetail: { fontSize: 7.5, color: PDF_COLORS.muted, marginTop: 1, lineHeight: 1.4 },
  historyTime: { fontSize: 6.8, color: PDF_COLORS.muted, marginTop: 2 },
  evidenceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  evidenceCard: {
    width: "31%",
    minHeight: 90,
    borderWidth: 0.5,
    borderColor: PDF_COLORS.border,
    borderRadius: 4,
    padding: 5,
    backgroundColor: PDF_COLORS.light,
  },
  evidenceImage: { width: "100%", height: 72, objectFit: "cover", borderRadius: 3 },
  evidenceName: { fontSize: 6.5, color: PDF_COLORS.muted, marginTop: 4 },
  evidenceEmpty: { fontSize: 8, color: PDF_COLORS.muted, fontStyle: "italic" },
});

const formatDate = (dateStr: string) =>
  fmtDate(dateStr, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatShortDate = (dateStr: string) =>
  fmtDate(dateStr, { day: "2-digit", month: "short", year: "numeric" });

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

export const TicketPDF = ({ ticket, attachments = [] }: Props) => {
  const { t: tt } = useTranslation("tickets");
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
      detail: h.autor?.name ? tt("pdf.byAuthor", { name: h.autor.name }) : undefined,
      dot: dotColorFor(h.type, h.detail),
    });
  });
  ticket.comments.forEach((c) => {
    timeline.push({
      id: c.id,
      ts: c.creadoEn,
      title: tt("pdf.commentBy", { author: c.autor?.name ?? tt("pdf.fallbackUser") }),
      detail: c.texto,
      dot: PDF_COLORS.gray,
    });
  });
  timeline.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  const cols = KANBAN_COLS.map((col) => ({
    ...col,
    items: ticket.assignments.filter((a) => a.status === col.status),
  }));
  const completedTasks = ticket.assignments.filter((assignment) => assignment.status === "COMPLETADA").length;

  return (
    <Document title={`Ticket - ${ticket.titulo}`} author="Puerto Nuevo Hotel y Villas">
      <Page size="A4" style={pdfTheme.page}>
        <PdfLetterhead title={tt("pdf.legend")} pageIndex={0} pageCount={1} generatedAt={today} />

        <View style={pdfTheme.content}>
          {/* ── Encabezado ── */}
          <View style={styles.titleRow}>
            <Text style={styles.ticketTitle}>{ticket.titulo}</Text>
            <Text style={{ ...styles.statusBadge, backgroundColor: STATUS_COLORS[ticket.status] ?? PDF_COLORS.gray }}>
              {dyn(tt)(`statusLabels.${ticket.status}`) ?? ticket.status}
            </Text>
          </View>
          <Text style={styles.idLine}>
            Ticket #{ticket.id.slice(0, 8).toUpperCase()} · {tt("pdf.createdPrefix")} {formatShortDate(ticket.creadoEn)}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>{tt("pdf.priority")}</Text>
              <Text style={styles.metaValue}>{dyn(tt)(`priorityLabels.${ticket.priority}`) ?? ticket.priority}</Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>{tt("pdf.category")}</Text>
              <Text style={styles.metaValue}>{ticket.category?.nombre ?? "—"}</Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>{tt("pdf.department")}</Text>
              <Text style={styles.metaValue}>{ticket.department?.name ?? "—"}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>{tt("pdf.createdBy")}</Text>
              <Text style={styles.metaValue}>{ticket.creadoPor?.name ?? "—"}</Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>{tt("pdf.assignedTo")}</Text>
              <Text style={styles.metaValue}>{ticket.asignadoA?.name ?? tt("pdf.unassigned")}</Text>
            </View>
            {ticket.closedAt ? (
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>{tt("pdf.closed")}</Text>
                <Text style={{ ...styles.metaValue, color: PDF_COLORS.success }}>
                  {formatShortDate(ticket.closedAt)}
                </Text>
              </View>
            ) : (
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>{tt("pdf.tasks")}</Text>
                <Text style={styles.metaValue}>
                  {ticket.assignments.filter((a) => a.status === "COMPLETADA").length}/{ticket.assignments.length}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{tt("pdf.description")}</Text>
            <Text style={styles.description}>{ticket.descripcion}</Text>
          </View>

          {attachments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{tt("pdf.evidence", { count: attachments.length })}</Text>
              <View style={styles.evidenceGrid}>
                {attachments.map((attachment) => (
                  <View key={attachment.id} style={styles.evidenceCard}>
                    {attachment.mimeType.startsWith("image/") ? (
                      <Image src={attachment.dataUrl ?? attachment.url} style={styles.evidenceImage} />
                    ) : (
                      <Text style={styles.evidenceEmpty}>
                        {attachment.mimeType.startsWith("video/") ? tt("pdf.fileVideo") : tt("pdf.fileDocument")}
                      </Text>
                    )}
                    <Text style={styles.evidenceName}>{attachment.originalName}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Tablero kanban ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {tt("pdf.kanbanTitle", { count: ticket.assignments.length, done: completedTasks })}
            </Text>
            {ticket.assignments.length === 0 ? (
              <Text style={styles.emptyCol}>{tt("pdf.noAssignments")}</Text>
            ) : (
              <View style={styles.kanbanRow}>
                {cols.map((col) => (
                  <View key={col.status} style={{ ...styles.kanbanCol, borderTopColor: col.color }}>
                    <View style={styles.kanbanColHeader}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={{ ...styles.kanbanDot, backgroundColor: col.color }} />
                        <Text style={styles.kanbanColTitle}>{dyn(tt)(`detail.taskStatusOptions.${col.status}`)}</Text>
                      </View>
                      <Text style={styles.kanbanCount}>{col.items.length}</Text>
                    </View>
                    {col.items.length === 0 ? (
                      <Text style={styles.emptyCol}>{tt("pdf.emptyCol")}</Text>
                    ) : (
                      col.items.map((a) => (
                        <View key={a.id} style={styles.taskCard}>
                          <Text style={styles.taskEmployee}>{a.user.name}</Text>
                          <Text style={styles.taskNo}>
                            {a.user.numeroEmpleado ? tt("pdf.employeeNo", { number: a.user.numeroEmpleado }) : ""}
                          </Text>
                          <Text style={{ ...styles.taskTitleText }}>{a.title}</Text>
                          {a.description ? (
                            <Text style={styles.taskText}>{a.description}</Text>
                          ) : null}
                          {a.dueDate && a.status !== "COMPLETADA" && new Date(a.dueDate) < new Date() && (
                            <Text style={{ ...styles.taskText, color: PDF_COLORS.danger, fontFamily: "Helvetica-Bold" }}>
                              {tt("pdf.overdue")}
                            </Text>
                          )}
                          {(a.startDate || a.dueDate) && (
                            <Text style={styles.taskDates}>
                              {a.startDate ? `${tt("pdf.startDate")} ${formatShortDate(a.startDate)}` : ""}
                              {a.startDate && a.dueDate ? " · " : ""}
                              {a.dueDate ? `${tt("pdf.endDate")} ${formatShortDate(a.dueDate)}` : ""}
                            </Text>
                          )}
                          {a.comments && a.comments.length > 0 && (
                            <Text style={styles.taskDates}>
                              {tt("pdf.commentsCount", { count: a.comments.length })}
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
              <Text style={styles.sectionTitle}>{tt("pdf.historyTitle", { count: timeline.length })}</Text>
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
