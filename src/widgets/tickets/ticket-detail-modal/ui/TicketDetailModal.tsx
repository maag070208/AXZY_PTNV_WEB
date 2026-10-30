import { LottieLoader } from "@shared/ui/lottie-loader";
import { ITButton, ITDialog, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { LuCalendarDays, LuExternalLink, LuMessageSquare, LuTicket } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n/dyn";
import { ASSIGNMENT_TONE, PRIORITY_TONE, STATUS_TONE, TicketChip, type Ticket } from "@entities/ticket";
import { DialogHeader } from "@shared/ui/dialog-header";
import { LangostinState } from "@shared/ui/langostin";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { formatDate } from "@shared/i18n";
import { formatDateTime } from "@shared/utils/dates";
import TicketAttachments from "@widgets/tickets/ticket-attachments";

type Props = {
  ticket: Ticket | null;
  loading: boolean;
  canManage: boolean;
  currentUserId?: string;
  onClose: () => void;
  onOpenFull: (ticketId: string) => void;
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-1 py-3">
      <span className="text-xs text-slate-500">{label}</span>
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
    <ITDialog 
      isOpen={loading || !!ticket} 
      className="w-full !max-w-5xl" 
      onClose={onClose}
    >
      {loading || !ticket ? (
        <ITFlex justify="center" align="center" className="py-10">
          <LottieLoader size="lg" />
        </ITFlex>
      ) : (
        <div className="min-w-full">
          {/* Encabezado héroe: folio, título y chips de estado */}
          <div className="pr-8">
            <DialogHeader
              icon={<LuTicket size={20} />}
              title={ticket.title}
              subtitle={`#${ticket.id.slice(0, 8).toUpperCase()} · ${tt("detail.createdOn", { date: formatDateTime(ticket.createdAt) })}`}
            />
            <div className="mb-4 flex flex-wrap gap-1.5">
              <TicketChip tone={STATUS_TONE[ticket.status]} label={dyn(tt)(`statusLabels.${ticket.status}`)} />
              <TicketChip tone={PRIORITY_TONE[ticket.priority]} label={dyn(tt)(`priorityLabels.${ticket.priority}`)} />
              <TicketChip tone="primary" label={ticket.department?.name ?? tt("list.general")} />
            </div>
          </div>

          {/* Cuerpo en Grid/Flex estricto con estilos inline de respaldo por si fallan las utilidades */}
          <div className="overflow-y-auto pr-1" style={{ maxHeight: "min(60vh, 560px)" }}>
            <div 
              className="flex flex-col md:flex-row gap-6 items-start" 
              style={{ display: "flex", flexDirection: "row", flexWrap: "nowrap" }}
            >
              
              {/* Columna Izquierda (Principal) */}
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <div>
                  <ITText className="text-xs font-semibold text-slate-500 mb-1.5">
                    {tt("detail.description")}
                  </ITText>
                  <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {ticket.description || tt("detail.noDescription")}
                  </div>
                </div>

                <div className="mt-4">
                  <TicketAttachments
                    ticketId={ticket.id}
                    canUpload={canManage || Boolean(ticket.createdById === currentUserId)}
                  />
                </div>

                <div className="mt-4">
                  <ITText className="text-xs font-semibold text-slate-500 mb-2">
                    {tt("detail.assignmentsTitle", { count: ticket.assignments.length })}
                  </ITText>

                  {ticket.assignments.length === 0 ? (
                    <LangostinState kind="empty" size="sm" title={tt("detail.noAssignmentsYet")} description="" />
                  ) : (
                    <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: "42vh" }}>
                      {ticket.assignments.map((t) => {
                        const overdue = Boolean(
                          t.dueDate && t.status !== "COMPLETED" && new Date(t.dueDate) < new Date()
                        );
                        return (
                          <div
                            key={t.id}
                            className="flex items-start gap-3 rounded-2xl bg-slate-50 px-3.5 py-3"
                          >
                            <ProfileAvatar name={t.user.name} size="sm" />

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
                                    <LuCalendarDays size={12} />
                                    {tt("detail.startShort")} {formatDate(t.startDate)}
                                  </span>
                                )}
                                {t.dueDate && (
                                  <span
                                    className={`inline-flex items-center gap-1 ${overdue ? "font-semibold text-[color:var(--color-danger)]" : ""}`}
                                  >
                                    <LuCalendarDays size={12} />
                                    {tt("detail.dueShort")} {formatDate(t.dueDate)}
                                  </span>
                                )}
                                {t.comments && t.comments.length > 0 && (
                                  <span className="inline-flex items-center gap-1">
                                    <LuMessageSquare size={12} />
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

                            <TicketChip tone={ASSIGNMENT_TONE[t.status]} label={dyn(tt)(`detail.taskStatusOptions.${t.status}`)} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Columna Derecha (Aside) */}
              <aside style={{ width: "220px", flexShrink: 0 }} className="flex flex-col">
                <ITButton
                  variant="filled"
                  color="primary"
                  className="w-full justify-center mb-2"
                  onClick={() => onOpenFull(ticket.id)}
                >
                  <ITFlex align="center" gap={1} justify="center">
                    <LuExternalLink size={13} />
                    <ITText className="font-semibold text-xs">{tt("detail.openFullDetail")}</ITText>
                  </ITFlex>
                </ITButton>

                <DetailRow label={tt("detail.createdByLabel")}>
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <ProfileAvatar name={ticket.createdBy?.name ?? "—"} size="xs" />
                    {ticket.createdBy?.name}
                  </span>
                </DetailRow>
                <DetailRow label={tt("detail.assignedTo")}>
                  {ticket.assignedTo ? (
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <ProfileAvatar name={ticket.assignedTo.name} size="xs" />
                      {ticket.assignedTo.name}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">{tt("detail.unassigned")}</span>
                  )}
                </DetailRow>
              </aside>

            </div>
          </div>
        </div>
      )}
    </ITDialog>
  );
}