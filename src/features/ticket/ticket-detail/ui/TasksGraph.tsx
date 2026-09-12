import {
  ITBadget,
  ITButton,
  ITDatePicker,
  ITFlex,
  ITGrid,
  ITInput,
  ITSearchSelect,
  ITSelect,
  ITStack,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { FaComment, FaPaperPlane, FaPlus, FaProjectDiagram, FaTicketAlt, FaTrash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatFechaHora } from "@shared/utils/dates";
import { dyn } from "@shared/i18n/dyn";
import { STATUS_BADGE } from "@entities/ticket";
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

const statusMeta: Record<string, { dot: string; bar: string }> = {
  PENDIENTE: { dot: "bg-slate-400", bar: "border-slate-300" },
  EN_PROGRESO: { dot: "bg-blue-500", bar: "border-blue-400" },
  EN_REVISION: { dot: "bg-purple-500", bar: "border-purple-400" },
  COMPLETADA: { dot: "bg-emerald-500", bar: "border-emerald-400" },
};

export default function TasksGraph({ fx, canManage, renderAssignmentAttachments }: Props) {
  const { t: tt } = useTranslation("tickets");
  const ticket = fx.ticket;
  if (!ticket) return null;

  const isClosed = fx.isClosed;

  if (!fx.tasksOpen) {
    return (
      <ITFlex justify="between" align="center" className="w-full rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
        <ITFlex align="center" gap={2}>
          <FaProjectDiagram size={14} className="text-emerald-600" />
          <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            {tt("detail.tasksGraph")}
          </ITText>
          <ITBadget color="primary" size="small">
            {ticket.assignments.length}
          </ITBadget>
        </ITFlex>
        <ITButton
          variant="outlined"
          color="secondary"
          size="small"
          onClick={() => fx.setTasksOpen(true)}
        >
          <ITText className="text-[10px] font-bold">{tt("detail.showTasks")}</ITText>
        </ITButton>
      </ITFlex>
    );
  }

  return (
    <ITStack direction="column" spacing={3} className="w-full">
      <ITFlex align="center" justify="between" wrap="wrap" gap={2}>
        <ITFlex align="center" gap={2}>
          <FaProjectDiagram size={14} className="text-emerald-600" />
          <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            {tt("detail.tasksGraph")}
          </ITText>
          <ITButton
            variant="outlined"
            color="secondary"
            size="small"
            onClick={() => fx.setTasksOpen(false)}
          >
            <ITText className="text-[10px] font-bold">{tt("detail.hideTasks")}</ITText>
          </ITButton>
        </ITFlex>
        <ITBadget color="primary" size="small">
          {tt("detail.assignmentsCount", { count: ticket.assignments.length })}
        </ITBadget>
      </ITFlex>

      {/* Nodo raíz (ticket) */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className="w-3.5 h-3.5 rounded-full bg-slate-800 ring-4 ring-slate-200" />
          <div className="w-px flex-1 bg-slate-300 min-h-4" />
        </div>
        <div className="flex-1 min-w-0 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-sm mb-1">
          <ITFlex justify="between" align="center" gap={2} wrap="wrap">
            <ITFlex align="center" gap={2} className="min-w-0">
              <FaTicketAlt size={13} className="text-slate-400 shrink-0" />
              <ITText className="text-[13px] font-black text-white leading-tight truncate">
                {ticket.titulo}
              </ITText>
            </ITFlex>
            <ITBadget color={(STATUS_BADGE[ticket.status]?.color as any) ?? "default"} size="small">
              {dyn(tt)(`statusLabels.${ticket.status}`)}
            </ITBadget>
          </ITFlex>
        </div>
      </div>

      {/* Asignaciones */}
      {ticket.assignments.length === 0 ? (
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-px flex-1 bg-slate-300 min-h-5" />
            <div className="w-3 h-3 rounded-full bg-slate-300 ring-4 ring-white" />
            <div className="w-px flex-1 bg-slate-300" />
          </div>
          <div className="flex-1 text-[11px] text-slate-400 italic py-2">
            {tt("detail.noAssignments")}
          </div>
        </div>
      ) : (
        ticket.assignments.map((a) => {
          const meta = statusMeta[a.status] ?? statusMeta.PENDIENTE;
          const assignmentOpen = fx.expandedAssignments[a.id] ?? false;
          const canEditTask = canManage && !isClosed;
          const canEditStatus =
            !isClosed && (canManage || a.userId === fx.currentUser?.id);
          return (
            <div key={a.id} className="flex gap-3">
              <div className="flex flex-col items-center self-stretch">
                <div className="w-px flex-1 bg-slate-300" />
                <div className={`w-3 h-3 rounded-full ${meta.dot} ring-4 ring-white shadow-sm`} />
                <div className="w-px flex-1 bg-slate-300" />
              </div>
              <div className={`flex-1 pb-3 min-w-0 rounded-xl border-l-4 ${meta.bar} bg-white border border-slate-200 shadow-sm p-3`}>
                <ITFlex justify="between" align="center" gap={2} className="mb-2">
                  <ITFlex align="center" gap={2} className="min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      <ITText className="text-[11px] font-black text-slate-600">
                        {a.user.name
                          .split(" ")
                          .map((p) => p[0])
                          .filter(Boolean)
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </ITText>
                    </div>
                    <ITStack direction="column" spacing={0} className="min-w-0">
                      <ITText className="text-[12px] font-black text-slate-800 leading-tight truncate">
                        {a.user.name}
                      </ITText>
                      {a.user.numeroEmpleado && (
                        <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          {tt("detail.employeeNo", { number: a.user.numeroEmpleado })}
                        </ITText>
                      )}
                    </ITStack>
                  </ITFlex>
                  <ITFlex align="center" gap={2} className="shrink-0">
                    {canManage && !isClosed && (
                      <ITButton
                        variant="outlined"
                        size="small"
                        color="danger"
                        onClick={() => fx.handleRemoveAssignment(a.id)}
                        title={tt("detail.removeTask")}
                        disabled={fx.updatingId === a.id}
                      >
                        <FaTrash size={10} />
                      </ITButton>
                    )}
                    <ITBadget
                      color={
                        a.status === "COMPLETADA"
                          ? "success"
                          : a.status === "EN_PROGRESO"
                          ? "info"
                          : a.status === "EN_REVISION"
                          ? "purple"
                          : "gray"
                      }
                      size="small"
                    >
                      {dyn(tt)(`detail.taskStatusOptions.${a.status}`)}
                    </ITBadget>
                    <ITButton
                      variant="outlined"
                      size="small"
                      color="secondary"
                      onClick={() =>
                        fx.setExpandedAssignments((current) => ({
                          ...current,
                          [a.id]: !assignmentOpen,
                        }))
                      }
                    >
                      <ITText className="text-[10px] font-bold">
                        {assignmentOpen ? tt("detail.hide") : tt("detail.open")}
                      </ITText>
                    </ITButton>
                  </ITFlex>
                </ITFlex>

                {assignmentOpen && (
                  <ITStack direction="column" spacing={2}>
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
                          "PENDIENTE",
                          "EN_PROGRESO",
                          "EN_REVISION",
                          ...(fx.isAdmin || fx.isGerente ? ["COMPLETADA"] : []),
                        ].map((value) => ({
                          value,
                          label: dyn(tt)(`detail.taskStatusOptions.${value}`),
                        }))}
                        value={a.status}
                        disabled={
                          !canEditStatus || (a.status === "COMPLETADA" && !fx.isAdmin && !fx.isGerente)
                        }
                        onChange={(e) => fx.handleUpdateAssignment(a.id, { status: e.target.value })}
                      />
                    )}

                    {renderAssignmentAttachments({
                      ticketId: ticket.id,
                      assignmentId: a.id,
                      canUpload:
                        fx.isAdmin ||
                        fx.isGerente ||
                        ticket.asignadoAId === fx.currentUser?.id ||
                        (fx.isJefeArea && ticket.creadoPorId === fx.currentUser?.id) ||
                        a.userId === fx.currentUser?.id,
                    })}

                    {/* Comentarios de la tarea */}
                    <div className="border-t border-slate-100 pt-2">
                      <ITButton
                        variant="outlined"
                        size="small"
                        color="secondary"
                        onClick={() =>
                          fx.setCommentOpen((s) => ({ ...s, [a.id]: !s[a.id] }))
                        }
                      >
                        <ITFlex align="center" gap={1}>
                          <FaComment size={10} />
                          <ITText className="font-bold text-[10px]">
                            {tt("detail.commentsCount", { count: a.comments?.length ?? 0 })}
                          </ITText>
                        </ITFlex>
                      </ITButton>

                      {fx.commentOpen[a.id] && (
                        <div className="mt-2 space-y-2">
                          {(a.comments ?? []).length === 0 ? (
                            <ITText className="text-[10px] text-slate-400 italic">
                              {tt("detail.noComments")}
                            </ITText>
                          ) : (
                            (a.comments ?? []).map((c) => (
                              <div
                                key={c.id}
                                className="rounded-lg bg-slate-50 border border-slate-100 p-2"
                              >
                                <ITFlex justify="between" align="center" className="mb-0.5">
                                  <ITText className="text-[9px] font-black text-slate-600">
                                    {c.autor?.name ?? tt("detail.systemUser")}
                                  </ITText>
                                  <ITText className="text-[8px] text-slate-400">
                                    {formatFechaHora(c.createdAt)}
                                  </ITText>
                                </ITFlex>
                                <ITText className="text-[10px] text-slate-600 whitespace-pre-wrap">
                                  {c.texto}
                                </ITText>
                              </div>
                            ))
                          )}

                          {canEditStatus && (
                            <div className="flex gap-2 items-end">
                              <ITInput
                                name={`comment-${a.id}`}
                                placeholder={tt("detail.addCommentPlaceholder")}
                                value={fx.commentDrafts[a.id] ?? ""}
                                onChange={(e) =>
                                  fx.setCommentDrafts((d) => ({
                                    ...d,
                                    [a.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  e.key === "Enter" && fx.handleAddAssignmentComment(a.id)
                                }
                              />
                              <ITButton
                                variant="filled"
                                color="primary"
                                size="small"
                                onClick={() => fx.handleAddAssignmentComment(a.id)}
                                disabled={
                                  fx.sendingCommentId === a.id ||
                                  !(fx.commentDrafts[a.id] ?? "").trim()
                                }
                              >
                                <FaPaperPlane size={11} />
                              </ITButton>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </ITStack>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Agregar nodo (empleado + tarea) */}
      {canManage && !isClosed && (
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-px flex-1 bg-slate-300" />
            <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-white" />
            <div className="w-px flex-1 bg-slate-300" />
          </div>
          <div className="flex-1 min-w-0 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
            <ITFlex justify="between" align="center" gap={2}>
              <ITFlex align="center" gap={2}>
                <FaPlus size={11} className="text-emerald-600" />
                <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-600">
                  {tt("detail.newTask")}
                </ITText>
              </ITFlex>
              <ITButton
                variant="outlined"
                color="secondary"
                size="small"
                onClick={() => fx.setNewTaskOpen((open) => !open)}
              >
                <ITText className="text-[10px] font-bold">
                  {fx.newTaskOpen ? tt("detail.hide") : tt("detail.openForm")}
                </ITText>
              </ITButton>
            </ITFlex>
            {fx.newTaskOpen && (
              <ITGrid container columns={12} spacing={3}>
                <ITGrid item xs={12} md={7}>
                  <ITSearchSelect
                    name="newUserId"
                    label={tt("detail.employeeLabel")}
                    placeholder={tt("detail.searchEmployee")}
                    options={fx.empleadoOptions}
                    value={fx.selectedUserId}
                    onChange={fx.handleAssign}
                    onSearch={fx.buscarEmpleados}
                    isLoading={fx.busyEmpleados}
                  />
                </ITGrid>
                <ITGrid item xs={12} md={5}>
                  <ITInput
                    name="taskTitle"
                    label={tt("detail.taskTitle")}
                    placeholder={tt("detail.taskTitlePlaceholder")}
                    value={fx.taskTitle}
                    onChange={(e) => fx.setTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fx.handleAddAssignment()}
                  />
                </ITGrid>
                <ITGrid item xs={12}>
                  <ITTextarea
                    name="taskDesc"
                    label={tt("detail.taskDescription")}
                    placeholder={tt("detail.taskDescPlaceholder")}
                    rows={2}
                    value={fx.taskDesc}
                    onChange={(v) => fx.setTaskDesc(v)}
                  />
                </ITGrid>
                <ITGrid item xs={12} sm={6}>
                  <ITDatePicker
                    name="taskStart"
                    label={tt("detail.startDate")}
                    value={fx.taskStart ? new Date(fx.taskStart) : undefined}
                    onChange={(e: any) =>
                      fx.setTaskStart(
                        e.target.value ? e.target.value.toISOString() : ""
                      )
                    }
                  />
                </ITGrid>
                <ITGrid item xs={12} sm={6}>
                  <ITDatePicker
                    name="taskDue"
                    label={tt("detail.dueDate")}
                    value={fx.taskDue ? new Date(fx.taskDue) : undefined}
                    onChange={(e: any) =>
                      fx.setTaskDue(
                        e.target.value ? e.target.value.toISOString() : ""
                      )
                    }
                  />
                </ITGrid>
                <ITGrid item xs={12}>
                  <ITFlex justify="end">
                    <ITButton
                      variant="filled"
                      color="primary"
                      onClick={fx.handleAddAssignment}
                      disabled={
                        fx.savingAssignment ||
                        !fx.selectedUserId ||
                        !fx.taskTitle.trim()
                      }
                    >
                      <ITFlex align="center" gap={1}>
                        <FaPlus size={12} />
                        <ITText className="font-bold text-[11px]">
                          {tt("detail.assign")}
                        </ITText>
                      </ITFlex>
                    </ITButton>
                  </ITFlex>
                </ITGrid>
              </ITGrid>
            )}
          </div>
        </div>
      )}
    </ITStack>
  );
}