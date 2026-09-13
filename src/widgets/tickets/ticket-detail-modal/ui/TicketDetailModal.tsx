import { ITButton, ITDialog, ITFlex, ITLoader, ITText } from "@axzydev/axzy_ui_system";
import { FaBookmark, FaCalendarAlt, FaComments, FaExternalLinkAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n/dyn";
import type { Ticket } from "@entities/ticket";
import { formatDate } from "@shared/i18n";
import { formatFechaHora } from "@shared/utils/dates";
import TicketAttachments from "@widgets/tickets/ticket-attachments";
import {
  ASSIGNMENT_STATUS_META,
  Avatar,
  PRIORITY_META,
  STATUS_META,
  Tag,
  hashTone,
  metaFor,
} from "@widgets/tickets/kanban-ui";

type Props = {
  ticket: Ticket | null;
  loading: boolean;
  canManage: boolean;
  currentUserId?: string;
  onClose: () => void;
  onOpenFull: (ticketId: string) => void;
};

// Colores de borde vía `style`: `border-slate-*` no renderiza el color
// correcto en este proyecto (ver kanban-ui.tsx / KanbanBoard.tsx).
const BORDER = { subtle: "#f1f5f9", card: "#e2e8f0", dashed: "#cbd5e1" };

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-1 py-3" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
      <span className="text-xs text-slate-400">{label}</span>
      {children}
    </div>
  );
}

export default function TicketDetailModal({
  ticket,
  loading,
  canManage,
  currentUserId,
  onClose,
  onOpenFull,
}: Props) {
  const { t: tt } = useTranslation("tickets");
  return (
    <ITDialog isOpen={loading || !!ticket} className="w-full max-w-4xl" onClose={onClose}>
      {loading || !ticket ? (
        <ITFlex justify="center" align="center" className="py-10">
          <ITLoader variant="spinner" size="md" color="primary" />
        </ITFlex>
      ) : (
        <div>
          <div className="pb-4 pr-8 mb-5" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
            <ITFlex align="center" gap={2} className="mb-1.5">
              <FaBookmark size={12} className="text-emerald-500" />
              <span className="text-xs font-medium text-slate-400">
                #{ticket.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-400">
                {tt("detail.createdOn", { date: formatFechaHora(ticket.creadoEn) })}
              </span>
            </ITFlex>
            <ITText className="text-xl font-bold text-slate-900 leading-tight">{ticket.titulo}</ITText>
          </div>

          {/* Alto máximo forzado por estilo inline: `min()`/`calc()` en
              valores arbitrarios de Tailwind no compilan en este proyecto. */}
          <div className="overflow-y-auto pr-1" style={{ maxHeight: "min(64vh, 600px)" }}>
            {/* `grid`/`grid-cols-*` no está aplicando en absoluto en este
                proyecto (probado con valor arbitrario y con clases
                estándar). Flexbox sí funciona en todo lo demás, así que el
                layout de dos columnas se arma con flex + un ancho fijo de
                escala estándar en el aside (nada entre corchetes). */}
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex flex-col gap-5 min-w-0 flex-1">
                <div>
                  <ITText className="text-xs font-semibold text-slate-500 mb-1.5">
                    {tt("detail.description")}
                  </ITText>
                  <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {ticket.descripcion || tt("detail.noDescription")}
                  </div>
                </div>

                <TicketAttachments
                  ticketId={ticket.id}
                  canUpload={canManage || Boolean(ticket.creadoPorId === currentUserId)}
                />

                <div>
                  <ITText className="text-xs font-semibold text-slate-500 mb-2">
                    {tt("detail.assignmentsTitle", { count: ticket.assignments.length })}
                  </ITText>

                  {ticket.assignments.length === 0 ? (
                    <div
                      className="rounded-lg border border-dashed p-5 text-center"
                      style={{ borderColor: BORDER.dashed }}
                    >
                      <ITText className="text-xs text-slate-400">{tt("detail.noAssignmentsYet")}</ITText>
                    </div>
                  ) : (
                    <div
                      className="rounded-lg border overflow-y-auto"
                      style={{ borderColor: BORDER.card, maxHeight: "42vh" }}
                    >
                      {ticket.assignments.map((t, i) => {
                        const overdue = Boolean(
                          t.dueDate && t.status !== "COMPLETADA" && new Date(t.dueDate) < new Date()
                        );
                        return (
                          <div
                            key={t.id}
                            className="flex items-start gap-3 px-3.5 py-3"
                            style={i > 0 ? { borderTop: `1px solid ${BORDER.subtle}` } : undefined}
                          >
                            <Avatar name={t.user.name} seed={t.userId} />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-1.5 min-w-0">
                                <span className="text-[13px] font-semibold text-slate-800 truncate">
                                  {t.title}
                                </span>
                                {t.description ? (
                                  <span className="text-xs text-slate-500 min-w-0 flex-1 truncate">
                                    — {t.description}
                                  </span>
                                ) : null}
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400">
                                <span>{t.user.name}</span>
                                {t.startDate && (
                                  <span className="inline-flex items-center gap-1">
                                    <FaCalendarAlt size={9} />
                                    {tt("detail.startShort")} {formatDate(t.startDate)}
                                  </span>
                                )}
                                {t.dueDate && (
                                  <span
                                    className={`inline-flex items-center gap-1 ${overdue ? "text-red-500 font-medium" : ""}`}
                                  >
                                    <FaCalendarAlt size={9} />
                                    {tt("detail.dueShort")} {formatDate(t.dueDate)}
                                  </span>
                                )}
                                {t.comments && t.comments.length > 0 && (
                                  <span className="inline-flex items-center gap-1">
                                    <FaComments size={9} />
                                    {tt("detail.assignmentComments", { count: t.comments.length })}
                                  </span>
                                )}
                              </div>

                              <div className="mt-2">
                                <TicketAttachments
                                  ticketId={ticket.id}
                                  assignmentId={t.id}
                                  compact
                                  canUpload={canManage || t.userId === currentUserId}
                                />
                              </div>
                            </div>

                            <Tag
                              {...metaFor(ASSIGNMENT_STATUS_META, t.status)}
                              label={dyn(tt)(`detail.taskStatusOptions.${t.status}`)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Aside de detalles: ancho estándar de la escala de Tailwind
                  (w-60 = 240px), no un valor entre corchetes. */}
              <aside className="w-full md:w-60 shrink-0 flex flex-col">
                <ITButton
                  variant="filled"
                  color="primary"
                  className="w-full justify-center mb-1"
                  onClick={() => onOpenFull(ticket.id)}
                >
                  <ITFlex align="center" gap={1} justify="center">
                    <FaExternalLinkAlt size={11} />
                    <ITText className="font-semibold text-xs">{tt("detail.openFullDetail")}</ITText>
                  </ITFlex>
                </ITButton>

                <DetailRow label={tt("detail.statusLabel")}>
                  <Tag {...metaFor(STATUS_META, ticket.status)} label={dyn(tt)(`statusLabels.${ticket.status}`)} />
                </DetailRow>
                <DetailRow label={tt("detail.priorityLabel")}>
                  <Tag {...metaFor(PRIORITY_META, ticket.priority)} label={dyn(tt)(`priorityLabels.${ticket.priority}`)} />
                </DetailRow>
                <DetailRow label={tt("detail.deptLabel")}>
                  <Tag
                    label={ticket.department?.name ?? tt("list.general")}
                    tone={hashTone(ticket.department?.name ?? tt("list.general"))}
                  />
                </DetailRow>
                <DetailRow label={tt("detail.createdByLabel")}>
                  <span className="text-sm font-medium text-slate-700">{ticket.creadoPor?.name}</span>
                </DetailRow>
              </aside>
            </div>
          </div>
        </div>
      )}
    </ITDialog>
  );
}