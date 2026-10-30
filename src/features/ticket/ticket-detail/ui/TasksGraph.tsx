import {
  ITBentoSegments,
  ITButton,
  ITDatePicker,
  ITFlex,
  ITGrid,
  ITInput,
  ITSelect,
  ITStack,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import {
  LuCalendarDays,
  LuChevronDown,
  LuChevronUp,
  LuListChecks,
  LuMessageSquare,
  LuPlus,
  LuSend,
  LuTrash2,
} from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { emitAppEvent } from "@shared/lib/appEvents";
import { formatDate, formatDateTime } from "@shared/utils/dates";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { dyn } from "@shared/i18n/dyn";
import { LangostinState } from "@shared/ui/langostin";
import { ASSIGNMENT_TONE, TicketChip } from "@entities/ticket";
import type { UseTicketDetail } from "../model/useTicketDetail";

interface Props {
  fx: UseTicketDetail;
  canManage: boolean;
  renderAssignmentAttachments: (args: {
    ticketId: string;
    assignmentId: string;
    canUpload: boolean;
  }) => React.ReactNode;
}

/**
 * Tareas del ticket: una lista (no un grafo). Cada tarea es una tarjeta con el
 * responsable, el estado, el título y sus fechas; lo editable —título,
 * descripción, fechas, estado, archivos y comentarios— vive en «Detalles», y la
 * tarea nueva se captura en un formulario que se abre arriba de la lista.
 */
export default function TasksGraph({ fx, canManage, renderAssignmentAttachments }: Props) {
  const { t: tt } = useTranslation("tickets");
  const ticket = fx.ticket;
  if (!ticket) return null;

  const isClosed = fx.isClosed;
  const tareas = ticket.assignments;
  const canAddTask = canManage && !isClosed;

  if (!fx.tasksOpen) {
    return (
      <ITFlex
        justify="between"
        align="center"
        wrap="wrap"
        gap={2}
        className="w-full rounded-2xl bg-slate-50 px-4 py-3"
      >
        <ITFlex align="center" gap={2}>
          <LuListChecks size={16} className="text-slate-400" />
          <ITText className="!text-[13px] font-bold text-slate-800">{tt("detail.tasksTitle")}</ITText>
          <TicketChip tone="primary" label={String(tareas.length)} />
        </ITFlex>
        <ITButton variant="outlined" color="secondary" size="sm" onClick={() => fx.setTasksOpen(true)}>
          <ITText className="!text-[11px] font-bold">{tt("detail.showTasks")}</ITText>
        </ITButton>
      </ITFlex>
    );
  }

  return (
    <ITStack direction="column" spacing={4} className="w-full">
      {/* Encabezado: qué es y la acción principal, en una línea. */}
      <ITFlex align="center" justify="between" wrap="wrap" gap={2}>
        <ITFlex align="center" gap={2}>
          <LuListChecks size={16} className="text-slate-400" />
          <ITText as="h3" className="m-0 !text-[16px] font-bold !text-slate-800">{tt("detail.tasksTitle")}</ITText>
          <TicketChip tone="primary" label={tt("detail.tasksCount", { count: tareas.length })} />
        </ITFlex>
        <ITFlex align="center" gap={2}>
          {canAddTask && (
            <ITButton
              variant="filled"
              color="primary"
              size="sm"
              onClick={() => emitAppEvent("task:new", { ticketId: ticket.id, ticketTitle: ticket.title })}
            >
              <ITFlex align="center" gap={1}>
                <LuPlus size={12} />
                <ITText className="!text-[11px] font-bold">{tt("detail.newTask")}</ITText>
              </ITFlex>
            </ITButton>
          )}
          <ITButton variant="text" color="secondary" size="sm" onClick={() => fx.setTasksOpen(false)}>
            <ITText className="!text-[11px] font-bold">{tt("detail.hideTasks")}</ITText>
          </ITButton>
        </ITFlex>
      </ITFlex>

      {tareas.length > 0 && (
        <ITStack spacing={1.5}>
          <ITBentoSegments total={tareas.length} done={tareas.filter((a) => a.status === "COMPLETED").length} />
          <ITText className="m-0 text-[12px] text-slate-500">
            {tt("detail.tasksProgress", {
              done: tareas.filter((a) => a.status === "COMPLETED").length,
              total: tareas.length,
            })}
          </ITText>
        </ITStack>
      )}

      {/* Lista de tareas. */}
      {tareas.length === 0 ? (
        <LangostinState
          kind="empty"
          size="sm"
          title={tt("detail.noAssignmentsYet")}
          description={canAddTask ? tt("detail.noTasksHint") : undefined}
        />
      ) : (
        <ITStack direction="column" spacing={2}>
          {tareas.map((a) => {
            const open = fx.expandedAssignments[a.id] ?? false;
            const canEditTask = canManage && !isClosed;
            const canEditStatus = !isClosed && (canManage || a.userId === fx.currentUser?.id);
            const comentarios = a.comments?.length ?? 0;
            const vencida =
              !!a.dueDate && a.status !== "COMPLETED" && new Date(a.dueDate).getTime() < Date.now();

            return (
              <div
                key={a.id}
                className="rounded-2xl bg-slate-50"
              >
                {/* Quién y en qué estado. */}
                <ITFlex align="center" justify="between" wrap="wrap" gap={2} className="px-3 py-2.5">
                  <ITFlex align="center" gap={2} className="min-w-0">
                    <ProfileAvatar name={a.user.name} size="sm" />
                    <ITFlex direction="column" gap={0} className="min-w-0">
                      <ITText className="!text-[12px] font-bold text-slate-800 truncate">{a.user.name}</ITText>
                      {a.user.employeeNumber && (
                        <ITText className="!text-[12px] font-bold text-slate-400">
                          {tt("detail.employeeNo", { number: a.user.employeeNumber })}
                        </ITText>
                      )}
                    </ITFlex>
                  </ITFlex>

                  <ITFlex align="center" gap={2} className="shrink-0">
                    <TicketChip tone={ASSIGNMENT_TONE[a.status]} label={dyn(tt)(`detail.taskStatusOptions.${a.status}`)} />
                    {canManage && !isClosed && (
                      <ITButton
                        variant="text"
                        size="sm"
                        color="error"
                        onClick={() => fx.handleRemoveAssignment(a.id)}
                        title={tt("detail.removeTask")}
                        disabled={fx.updatingId === a.id}
                      >
                        <LuTrash2 size={13} />
                      </ITButton>
                    )}
                    <ITButton
                      variant="outlined"
                      color="secondary"
                      size="sm"
                      onClick={() =>
                        fx.setExpandedAssignments((current) => ({ ...current, [a.id]: !open }))
                      }
                    >
                      <ITFlex align="center" gap={1}>
                        <ITText className="!text-[10px] font-bold">
                          {tt("detail.taskDetails")}
                        </ITText>
                        {open ? <LuChevronUp size={12} /> : <LuChevronDown size={12} />}
                      </ITFlex>
                    </ITButton>
                  </ITFlex>
                </ITFlex>

                {/* Qué hay que hacer y cuándo. */}
                <ITFlex direction="column" gap={1.5} className="px-3 pb-3">
                  <ITText className="!text-[13px] font-semibold text-slate-800">
                    {a.title || tt("detail.taskTitlePlaceholder")}
                  </ITText>
                  <ITFlex align="center" gap={3} wrap="wrap" className="!text-[12px] text-slate-500">
                    {a.startDate && (
                      <ITText as="span" className="flex items-center gap-1">
                        <LuCalendarDays size={12} />
                        {tt("detail.startShort")} {formatDate(a.startDate)}
                      </ITText>
                    )}
                    {a.dueDate && (
                      <ITText as="span" className={`flex items-center gap-1 ${vencida ? "font-bold text-[color:var(--color-danger)]" : ""}`}>
                        <LuCalendarDays size={12} />
                        {tt("detail.dueShort")} {formatDate(a.dueDate)}
                      </ITText>
                    )}
                    {vencida && (
                      <TicketChip tone="danger" label={tt("detail.overdue")} />
                    )}
                    {comentarios > 0 && (
                      <ITText as="span" className="flex items-center gap-1">
                        <LuMessageSquare size={12} />
                        {tt("detail.assignmentComments", { count: comentarios })}
                      </ITText>
                    )}
                  </ITFlex>
                </ITFlex>

                {/* Detalles: lo editable, los archivos y los comentarios. */}
                {open && (
                  <ITStack direction="column" spacing={3} className="px-3 pb-3 pt-1">
                    <ITInput
                      name={`title-${a.id}`}
                      label={tt("detail.taskTitle")}
                      value={a.title}
                      disabled={!canEditTask}
                      onChange={(e) => fx.handleUpdateAssignment(a.id, { title: e.target.value })}
                    />

                    <ITTextarea
                      name={`desc-${a.id}`}
                      label={tt("detail.taskDescription")}
                      value={a.description}
                      disabled={!canEditTask}
                      rows={2}
                      onChange={(v) => fx.handleUpdateAssignment(a.id, { description: v })}
                    />

                    <ITGrid container columns={12} spacing={2}>
                      <ITGrid item xs={12} sm={6}>
                        <ITDatePicker
                          name={`start-${a.id}`}
                          label={tt("detail.startDate")}
                          value={a.startDate ? new Date(a.startDate) : undefined}
                          disabled={!canEditTask}
                          onChange={(e: any) =>
                            fx.handleUpdateAssignment(a.id, {
                              startDate: e.target.value ? e.target.value.toISOString() : null,
                            })
                          }
                        />
                      </ITGrid>
                      <ITGrid item xs={12} sm={6}>
                        <ITDatePicker
                          name={`due-${a.id}`}
                          label={tt("detail.dueDate")}
                          value={a.dueDate ? new Date(a.dueDate) : undefined}
                          disabled={!canEditTask}
                          onChange={(e: any) =>
                            fx.handleUpdateAssignment(a.id, {
                              dueDate: e.target.value ? e.target.value.toISOString() : null,
                            })
                          }
                        />
                      </ITGrid>
                    </ITGrid>

                    {canEditStatus && (
                      <ITSelect
                        name={`status-${a.id}`}
                        label={tt("detail.taskStatus")}
                        options={[
                          "PENDING",
                          "IN_PROGRESS",
                          "IN_REVIEW",
                          ...(fx.canCompleteTask ? ["COMPLETED"] : []),
                        ].map((value) => ({
                          value,
                          label: dyn(tt)(`detail.taskStatusOptions.${value}`),
                        }))}
                        value={a.status}
                        disabled={!canEditStatus || (a.status === "COMPLETED" && !fx.canCompleteTask)}
                        onChange={(e) => fx.handleUpdateAssignment(a.id, { status: e.target.value })}
                      />
                    )}

                    {renderAssignmentAttachments({
                      ticketId: ticket.id,
                      assignmentId: a.id,
                      canUpload: fx.canUploadToTicket || a.userId === fx.currentUser?.id,
                    })}

                    <div className="pt-2">
                      <ITButton
                        variant="outlined"
                        size="sm"
                        color="secondary"
                        onClick={() => fx.setCommentOpen((s) => ({ ...s, [a.id]: !s[a.id] }))}
                      >
                        <ITFlex align="center" gap={1}>
                          <LuMessageSquare size={12} />
                          <ITText className="!text-[10px] font-bold">
                            {tt("detail.commentsCount", { count: comentarios })}
                          </ITText>
                        </ITFlex>
                      </ITButton>

                      {fx.commentOpen[a.id] && (
                        <div className="mt-2 space-y-2">
                          {(a.comments ?? []).length === 0 ? (
                            <ITText className="!text-[11px] text-slate-400">{tt("detail.noComments")}</ITText>
                          ) : (
                            (a.comments ?? []).map((c) => (
                              <div key={c.id} className="rounded-xl bg-[var(--it-card-bg)] p-2.5">
                                <ITFlex justify="between" align="center" className="mb-0.5">
                                  <ITText className="!text-[10px] font-bold text-slate-600">
                                    {c.author?.name ?? tt("detail.systemUser")}
                                  </ITText>
                                  <ITText className="!text-[9px] text-slate-400">
                                    {formatDateTime(c.createdAt)}
                                  </ITText>
                                </ITFlex>
                                <ITText className="!text-[11px] text-slate-600 whitespace-pre-wrap">{c.text}</ITText>
                              </div>
                            ))
                          )}

                          {canEditStatus && (
                            <ITFlex align="end" gap={2}>
                              <ITInput
                                name={`comment-${a.id}`}
                                placeholder={tt("detail.addCommentPlaceholder")}
                                value={fx.commentDrafts[a.id] ?? ""}
                                onChange={(e) =>
                                  fx.setCommentDrafts((d) => ({ ...d, [a.id]: e.target.value }))
                                }
                                onKeyDown={(e) => e.key === "Enter" && fx.handleAddAssignmentComment(a.id)}
                              />
                              <ITButton
                                variant="filled"
                                color="primary"
                                size="sm"
                                onClick={() => fx.handleAddAssignmentComment(a.id)}
                                disabled={
                                  fx.sendingCommentId === a.id || !(fx.commentDrafts[a.id] ?? "").trim()
                                }
                              >
                                <LuSend size={12} />
                              </ITButton>
                            </ITFlex>
                          )}
                        </div>
                      )}
                    </div>
                  </ITStack>
                )}
              </div>
            );
          })}
        </ITStack>
      )}
    </ITStack>
  );
}
