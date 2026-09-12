import { ITButton, ITDialog, ITFlex, ITLoader, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { FaBookmark, FaCalendarAlt, FaComments, FaExternalLinkAlt } from "react-icons/fa";
import type { Ticket } from "@entities/ticket";
import { formatFechaHora } from "@core/utils/dates";
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

// Modal de detalle de ticket (solo lectura, sin alta de tareas), usado desde
// el tablero Kanban. Vive en su propio componente para no seguir inflando
// KanbanPage.tsx y poder tocarlo sin tener que leer/entender el tablero
// completo cada vez.
export default function TicketDetailModal({
  ticket,
  loading,
  canManage,
  currentUserId,
  onClose,
  onOpenFull,
}: Props) {
  return (
    <ITDialog isOpen={loading || !!ticket} className="w-full max-w-4xl" onClose={onClose}>
      {loading || !ticket ? (
        <ITFlex justify="center" align="center" className="py-10">
          <ITLoader variant="spinner" size="md" color="primary" />
        </ITFlex>
      ) : (
        <div>
          <div className="pb-3 border-b border-slate-100 pr-8 mb-4">
            <ITFlex align="center" gap={2} className="mb-1.5">
              <FaBookmark size={12} className="text-emerald-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                #{ticket.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-[10px] text-slate-400">Creado {formatFechaHora(ticket.creadoEn)}</span>
            </ITFlex>
            <ITText className="text-xl font-black text-slate-800 leading-tight">{ticket.titulo}</ITText>
          </div>

          {/* Alto máximo forzado por estilo inline: los valores arbitrarios de
              Tailwind con calc()/min() no estaban compilando en este proyecto,
              así que aquí no dependemos de eso para evitar que el modal se
              salga de la pantalla. */}
          <div className="overflow-y-auto pr-1" style={{ maxHeight: "min(64vh, 600px)" }}>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6">
              <ITStack direction="column" spacing={4} className="min-w-0">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                  <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Descripción</ITText>
                  <div className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {ticket.descripcion || "Sin descripción"}
                  </div>
                </div>

                <TicketAttachments
                  ticketId={ticket.id}
                  canUpload={canManage || Boolean(ticket.creadoPorId === currentUserId)}
                />

                <div>
                  <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Tareas asignadas ({ticket.assignments.length})
                  </ITText>
                  <div className="max-h-[42vh] overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ticket.assignments.map((t) => (
                        <div
                          key={t.id}
                          className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm flex flex-col"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <ITFlex align="center" gap={2} className="min-w-0">
                              <Avatar name={t.user.name} seed={t.userId} />
                              <div className="min-w-0">
                                <div className="text-[11px] font-black text-slate-700 truncate">{t.user.name}</div>
                                {t.user.numeroEmpleado && (
                                  <div className="text-[9px] text-slate-400">#{t.user.numeroEmpleado}</div>
                                )}
                              </div>
                            </ITFlex>
                            <Tag {...metaFor(ASSIGNMENT_STATUS_META, t.status)} />
                          </div>

                          <div className="flex items-baseline gap-1.5 mb-2 min-w-0">
                            <span className="text-[12.5px] font-bold text-slate-800 shrink-0 max-w-[55%] truncate">
                              {t.title}
                            </span>
                            {t.description ? (
                              <span className="text-[11.5px] text-slate-500 min-w-0 flex-1 truncate">
                                — {t.description}
                              </span>
                            ) : null}
                          </div>

                          {(t.startDate || t.dueDate || (t.comments && t.comments.length > 0)) && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] text-slate-400 mb-2">
                              {t.startDate && (
                                <span className="inline-flex items-center gap-1">
                                  <FaCalendarAlt size={9} />
                                  Inicio {new Date(t.startDate).toLocaleDateString("es-MX")}
                                </span>
                              )}
                              {t.dueDate && (
                                <span className="inline-flex items-center gap-1">
                                  <FaCalendarAlt size={9} className="text-rose-400" />
                                  Límite {new Date(t.dueDate).toLocaleDateString("es-MX")}
                                </span>
                              )}
                              {t.comments && t.comments.length > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <FaComments size={9} />
                                  {t.comments.length} comentario(s)
                                </span>
                              )}
                            </div>
                          )}

                          <div className="mt-auto pt-2 border-t border-slate-100">
                            <TicketAttachments
                              ticketId={ticket.id}
                              assignmentId={t.id}
                              compact
                              canUpload={canManage || t.userId === currentUserId}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {ticket.assignments.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center">
                        <ITText className="text-[11px] text-slate-400">Este ticket aún no tiene tareas asignadas.</ITText>
                      </div>
                    )}
                  </div>
                </div>
              </ITStack>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3 h-fit">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex items-center gap-1.5 px-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Estado:</span>
                    <Tag {...metaFor(STATUS_META, ticket.status)} />
                  </div>
                  <div className="flex items-center gap-1.5 px-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Prioridad:</span>
                    <Tag {...metaFor(PRIORITY_META, ticket.priority)} />
                  </div>
                  <div className="flex items-center gap-1.5 px-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Depto:</span>
                    <Tag label={ticket.department?.name ?? "General"} tone={hashTone(ticket.department?.name ?? "General")} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-200 text-[11px]">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Creado por</span>
                  <span className="font-bold text-slate-700">{ticket.creadoPor?.name}</span>
                </div>
                <ITButton
                  variant="filled"
                  color="primary"
                  className="w-full justify-center"
                  onClick={() => onOpenFull(ticket.id)}
                >
                  <ITFlex align="center" gap={1} justify="center">
                    <FaExternalLinkAlt size={11} />
                    <ITText className="font-bold text-[11px]">Abrir detalle completo</ITText>
                  </ITFlex>
                </ITButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </ITDialog>
  );
}
