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
import {
  FaCalendarAlt,
  FaChevronDown,
  FaChevronUp,
  FaClipboardList,
  FaComment,
  FaPaperPlane,
  FaPlus,
  FaTasks,
  FaTrash,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatDate, formatDateTime } from "@shared/utils/dates";
import { dyn } from "@shared/i18n/dyn";
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

/** Color por estado: borde izquierdo de la tarjeta y avatar del responsable. */
const STATUS_TONE: Record<string, { border: string; avatar: string }> = {
  PENDING: { border: "border-l-slate-300", avatar: "bg-slate-100 text-slate-500" },
  IN_PROGRESS: { border: "border-l-blue-400", avatar: "bg-blue-50 text-blue-600" },
  IN_REVIEW: { border: "border-l-purple-400", avatar: "bg-purple-50 text-purple-600" },
  COMPLETED: { border: "border-l-emerald-400", avatar: "bg-emerald-50 text-emerald-600" },
};

const STATUS_BADGE: Record<string, string> = {
  COMPLETED: "success",
  IN_PROGRESS: "info",
  IN_REVIEW: "purple",
  PENDING: "gray",
};

const initialsOf = (name: string): string =>
  name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

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

  /** Cierra el formulario y lo deja limpio para la siguiente tarea. */
  const cancelarNueva = () => {
    fx.setNewTaskOpen(false);
    fx.setSelectedUserId("");
    fx.setTaskTitle("");
    fx.setTaskDesc("");
  };

  if (!fx.tasksOpen) {
    return (
      <ITFlex
        justify="between"
        align="center"
        wrap="wrap"
        gap={2}
        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3"
      >
        <ITFlex align="center" gap={2}>
          <FaTasks size={13} className="text-slate-400" />
          <ITText className="!text-[12px] font-bold text-slate-700">{tt("detail.tasksTitle")}</ITText>
          <ITBadget color="primary" size="lg">
            {tareas.length}
          </ITBadget>
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
          <FaTasks size={13} className="text-slate-400" />
          <ITText className="!text-[13px] font-bold text-slate-800">{tt("detail.tasksTitle")}</ITText>
          <ITBadget color="primary" size="lg">
            {tt("detail.tasksCount", { count: tareas.length })}
          </ITBadget>
        </ITFlex>
        <ITFlex align="center" gap={2}>
          {canAddTask && !fx.newTaskOpen && (
            <ITButton variant="filled" color="primary" size="sm" onClick={() => fx.setNewTaskOpen(true)}>
              <ITFlex align="center" gap={1}>
                <FaPlus size={10} />
                <ITText className="!text-[11px] font-bold">{tt("detail.newTask")}</ITText>
              </ITFlex>
            </ITButton>
          )}
          <ITButton variant="text" color="secondary" size="sm" onClick={() => fx.setTasksOpen(false)}>
            <ITText className="!text-[11px] font-bold">{tt("detail.hideTasks")}</ITText>
          </ITButton>
        </ITFlex>
      </ITFlex>

      {/* Tarea nueva: se captura aquí mismo, arriba de la lista. */}
      {fx.newTaskOpen && canAddTask && (
        <div className="rounded-xl border border-[#0D5777]/25 bg-[#0D5777]/[0.03] p-4">
          <ITFlex direction="column" gap={1} className="mb-3">
            <ITText className="!text-[11px] font-black uppercase tracking-widest text-[#0D5777]">
              {tt("detail.newTask")}
            </ITText>
            <ITText className="!text-[11px] text-slate-500">{tt("detail.newTaskHint")}</ITText>
          </ITFlex>

          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} md={6}>
              <ITSearchSelect
                name="newUserId"
                label={tt("detail.employeeLabel")}
                placeholder={tt("detail.searchEmployee")}
                options={fx.employeeOptions}
                value={fx.selectedUserId}
                onChange={fx.handleAssign}
                onSearch={fx.searchEmployees}
                isLoading={fx.busyEmployees}
              />
            </ITGrid>
            <ITGrid item xs={12} md={6}>
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
                onChange={(e: any) => fx.setTaskStart(e.target.value ? e.target.value.toISOString() : "")}
              />
            </ITGrid>
            <ITGrid item xs={12} sm={6}>
              <ITDatePicker
                name="taskDue"
                label={tt("detail.dueDate")}
                value={fx.taskDue ? new Date(fx.taskDue) : undefined}
                onChange={(e: any) => fx.setTaskDue(e.target.value ? e.target.value.toISOString() : "")}
              />
            </ITGrid>
          </ITGrid>

          <ITFlex justify="end" align="center" gap={2} className="mt-3">
            <ITButton variant="text" color="secondary" size="sm" onClick={cancelarNueva}>
              <ITText className="!text-[11px] font-bold">{tt("detail.cancel")}</ITText>
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              size="sm"
              onClick={fx.handleAddAssignment}
              disabled={fx.savingAssignment || !fx.selectedUserId || !fx.taskTitle.trim()}
            >
              <ITFlex align="center" gap={1}>
                <FaPlus size={10} />
                <ITText className="!text-[11px] font-bold">{tt("detail.assign")}</ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        </div>
      )}

      {/* Lista de tareas. */}
      {tareas.length === 0 ? (
        <ITFlex
          direction="column"
          align="center"
          gap={1}
          className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8"
        >
          <FaClipboardList className="text-slate-300" size={22} />
          <ITText className="!text-[12px] font-bold text-slate-600">{tt("detail.noAssignmentsYet")}</ITText>
          {canAddTask && <ITText className="!text-[11px] text-slate-400">{tt("detail.noTasksHint")}</ITText>}
        </ITFlex>
      ) : (
        <ITStack direction="column" spacing={2}>
          {tareas.map((a) => {
            const tone = STATUS_TONE[a.status] ?? STATUS_TONE.PENDING;
            const open = fx.expandedAssignments[a.id] ?? false;
            const canEditTask = canManage && !isClosed;
            const canEditStatus = !isClosed && (canManage || a.userId === fx.currentUser?.id);
            const comentarios = a.comments?.length ?? 0;
            const vencida =
              !!a.dueDate && a.status !== "COMPLETED" && new Date(a.dueDate).getTime() < Date.now();

            return (
              <div
                key={a.id}
                className={`rounded-xl border border-slate-200 border-l-4 ${tone.border} bg-white shadow-sm`}
              >
                {/* Quién y en qué estado. */}
                <ITFlex align="center" justify="between" wrap="wrap" gap={2} className="px-3 py-2.5">
                  <ITFlex align="center" gap={2} className="min-w-0">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone.avatar} !text-[11px] font-black`}
                    >
                      {initialsOf(a.user.name)}
                    </span>
                    <ITFlex direction="column" gap={0} className="min-w-0">
                      <ITText className="!text-[12px] font-bold text-slate-800 truncate">{a.user.name}</ITText>
                      {a.user.employeeNumber && (
                        <ITText className="!text-[9px] font-bold uppercase tracking-widest text-slate-400">
                          {tt("detail.employeeNo", { number: a.user.employeeNumber })}
                        </ITText>
                      )}
                    </ITFlex>
                  </ITFlex>

                  <ITFlex align="center" gap={2} className="shrink-0">
                    <ITBadget color={(STATUS_BADGE[a.status] as any) ?? "gray"} size="lg">
                      {dyn(tt)(`detail.taskStatusOptions.${a.status}`)}
                    </ITBadget>
                    {canManage && !isClosed && (
                      <ITButton
                        variant="text"
                        size="sm"
                        color="error"
                        onClick={() => fx.handleRemoveAssignment(a.id)}
                        title={tt("detail.removeTask")}
                        disabled={fx.updatingId === a.id}
                      >
                        <FaTrash size={10} />
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
                        {open ? <FaChevronUp size={8} /> : <FaChevronDown size={8} />}
                      </ITFlex>
                    </ITButton>
                  </ITFlex>
                </ITFlex>

                {/* Qué hay que hacer y cuándo. */}
                <ITFlex direction="column" gap={1.5} className="px-3 pb-3">
                  <ITText className="!text-[13px] font-semibold text-slate-800">
                    {a.title || tt("detail.taskTitlePlaceholder")}
                  </ITText>
                  <ITFlex align="center" gap={3} wrap="wrap" className="!text-[10px] text-slate-500">
                    {a.startDate && (
                      <span className="flex items-center gap-1">
                        <FaCalendarAlt size={9} />
                        {tt("detail.startShort")} {formatDate(a.startDate)}
                      </span>
                    )}
                    {a.dueDate && (
                      <span className={`flex items-center gap-1 ${vencida ? "font-bold text-amber-700" : ""}`}>
                        <FaCalendarAlt size={9} />
                        {tt("detail.dueShort")} {formatDate(a.dueDate)}
                      </span>
                    )}
                    {vencida && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 !text-[9px] font-bold uppercase text-amber-800">
                        {tt("detail.overdue")}
                      </span>
                    )}
                    {comentarios > 0 && (
                      <span className="flex items-center gap-1">
                        <FaComment size={9} />
                        {tt("detail.assignmentComments", { count: comentarios })}
                      </span>
                    )}
                  </ITFlex>
                </ITFlex>

                {/* Detalles: lo editable, los archivos y los comentarios. */}
                {open && (
                  <ITStack direction="column" spacing={3} className="border-t border-slate-100 px-3 py-3">
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

                    <div className="border-t border-slate-100 pt-3">
                      <ITButton
                        variant="outlined"
                        size="sm"
                        color="secondary"
                        onClick={() => fx.setCommentOpen((s) => ({ ...s, [a.id]: !s[a.id] }))}
                      >
                        <ITFlex align="center" gap={1}>
                          <FaComment size={10} />
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
                              <div key={c.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
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
                            <div className="flex items-end gap-2">
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
            );
          })}
        </ITStack>
      )}
    </ITStack>
  );
}
