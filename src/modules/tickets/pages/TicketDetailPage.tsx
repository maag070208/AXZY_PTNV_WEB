import {
  ITBadget,
  ITButton,
  ITConfirmDialog,
  ITDatePicker,
  ITFlex,
  ITGrid,
  ITInput,
  ITPage,
  ITSearchSelect,
  ITSelect,
  ITStack,
  ITTextarea,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import {
  FaBuilding,
  FaCheckCircle,
  FaClock,
  FaComment,
  FaFilePdf,
  FaPaperPlane,
  FaPlus,
  FaProjectDiagram,
  FaSync,
  FaTicketAlt,
  FaTimesCircle,
  FaTrash,
  FaTrashRestore,
  FaTrello,
  FaUserCog,
  FaUserPlus,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import type { AppDispatch, RootState } from "@core/store/store";
import {
  fetchTicketById,
  updateTicketThunk,
  addCommentThunk,
  clearCurrent,
} from "@core/store/tickets/tickets.slice";
import { ticketsApi } from "@core/api/tickets.api";
import { usersApi, type User, type UserRole } from "@core/api/auth.api";
import { departmentsApi, type Department } from "@core/api/departments.api";
import { formatFechaHora } from "@core/store/cartas/types";
import { useAblyTicket } from "@core/hooks/useAbly";
import { downloadTicketPDF } from "../utils/pdf";
import TicketAttachments from "../components/TicketAttachments";

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  ABIERTO: { color: "warning", label: "Abierto" },
  EN_SEGUIMIENTO: { color: "info", label: "En seguimiento" },
  CERRADO: { color: "success", label: "Cerrado" },
};

const PRIORITY_BADGE: Record<string, { color: string; label: string }> = {
  BAJA: { color: "default", label: "Baja" },
  MEDIA: { color: "warning", label: "Media" },
  ALTA: { color: "danger", label: "Alta" },
  URGENTE: { color: "danger", label: "Urgente" },
};

const STATUS_LABELS: Record<string, string> = {
  ABIERTO: "Abierto",
  EN_SEGUIMIENTO: "En seguimiento",
  CERRADO: "Cerrado",
};

const CATEGORY_LABELS: Record<string, string> = {
  MANTENIMIENTO: "Mantenimiento",
  EQUIPO: "Equipo",
  SISTEMA: "Sistema",
  OTRO: "Otro",
};

interface TimelineEvent {
  id: string;
  type: "created" | "status_change" | "assigned" | "department" | "comment";
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  detail?: string;
  author?: string;
  timestamp: string;
}

const todayInput = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const ticket = useSelector((s: RootState) => s.tickets.current);
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = currentUser?.role === "ADMIN";
  const isGerente = currentUser?.role === "GERENTE";
  const isJefeArea = currentUser?.role === "JEFE_DE_AREA";
  const canEditTicket = isAdmin || isGerente || (isJefeArea && ticket?.creadoPorId === currentUser?.id);
  const canCreateTasks = Boolean(ticket && (isAdmin || ticket.creadoPorId === currentUser?.id || ticket.asignadoAId === currentUser?.id));
  const isInvolved =
    !!ticket &&
      (ticket.creadoPorId === currentUser?.id ||
       ticket.asignadoAId === currentUser?.id ||
       ticket.assignments.some((a) => a.userId === currentUser?.id));

  const [empleados, setEmpleados] = useState<User[]>([]);
  const [responsables, setResponsables] = useState<User[]>([]);
  const [busyEmpleados, setBusyEmpleados] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [commentText, setCommentText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [sendingComment, setSendingComment] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskStart, setTaskStart] = useState(todayInput);
  const [taskDue, setTaskDue] = useState(todayInput);
  const [tasksOpen, setTasksOpen] = useState(true);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [expandedAssignments, setExpandedAssignments] = useState<Record<string, boolean>>({});
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [commentOpen, setCommentOpen] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [sendingCommentId, setSendingCommentId] = useState<string | null>(null);

  const handleDeleteTicket = async () => {
    if (!ticket) return;
    try {
      await ticketsApi.remove(ticket.id);
      setDeleteOpen(false);
      navigate("/tickets");
    } catch (e: any) {
      setToastType("error");
      setToast(e.message);
      setDeleteOpen(false);
    }
  };

  useEffect(() => {
    if (id) dispatch(fetchTicketById(id));
    return () => { dispatch(clearCurrent()); };
  }, [id, dispatch]);

  // Ably: live comments
  useAblyTicket(id, (data) => {
    if (data?.comment) {
      dispatch(fetchTicketById(id!));
    }
  });

  useEffect(() => {
    usersApi.empleados().then(setEmpleados).catch(() => setEmpleados([]));
    usersApi.empleadosPorRoles(["ADMIN", "GERENTE", "JEFE_DE_AREA", "EMPLEADO"] as UserRole[]).then(setResponsables).catch(() => setResponsables([]));
  }, []);

  useEffect(() => {
    departmentsApi.list().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  const buscarEmpleados = async (q?: string) => {
    setBusyEmpleados(true);
    try {
      const res = await usersApi.empleados(undefined, q || undefined);
      setEmpleados(res);
    } catch {
      setEmpleados([]);
    } finally {
      setBusyEmpleados(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const refresh = () => {
    if (id) dispatch(fetchTicketById(id));
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    const action = await dispatch(
      updateTicketThunk({ id: ticket.id, data: { status: newStatus } })
    );
    if (updateTicketThunk.fulfilled.match(action)) {
      refresh();
      setToastType("success");
      setToast(`Estado cambiado a ${STATUS_LABELS[newStatus] ?? newStatus}`);
    }
  };

  const handleCategoryChange = async (newCategory: string) => {
    if (!ticket) return;
    const action = await dispatch(
      updateTicketThunk({ id: ticket.id, data: { category: newCategory } })
    );
    if (updateTicketThunk.fulfilled.match(action)) {
      refresh();
      setToastType("success");
      setToast(`Categoría cambiada a ${CATEGORY_LABELS[newCategory] ?? newCategory}`);
    }
  };

  const handleDepartmentChange = async (newDepartmentId: string) => {
    if (!ticket) return;
    const action = await dispatch(
      updateTicketThunk({
        id: ticket.id,
        data: { departmentId: newDepartmentId || null },
      })
    );
    if (updateTicketThunk.fulfilled.match(action)) {
      refresh();
      setToastType("success");
      const dept = departments.find((d) => d.id === newDepartmentId);
      setToast(`Departamento cambiado a ${dept?.name ?? "Sin asignar"}`);
    }
  };

  const handleResponsibleChange = async (userId: string) => {
    if (!ticket) return;
    const action = await dispatch(updateTicketThunk({ id: ticket.id, data: { asignadoAId: userId || null } }));
    if (updateTicketThunk.fulfilled.match(action)) {
      refresh();
      setToastType("success");
      setToast(userId ? "Responsable asignado" : "Responsable removido");
    }
  };

  const handleAssign = async (value: string | number) => {
    setSelectedUserId(String(value));
  };

  const handleAddAssignment = async () => {
    if (!ticket || !selectedUserId || !taskTitle.trim()) return;
    setSavingAssignment(true);
    try {
      await ticketsApi.addAssignment(ticket.id, {
        userId: selectedUserId,
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        startDate: taskStart || null,
        dueDate: taskDue || null,
      });
      setSelectedUserId("");
      setTaskTitle("");
      setTaskDesc("");
       setTaskStart(todayInput());
       setTaskDue(todayInput());
      setToastType("success");
      setToast("Tarea asignada");
      refresh();
    } catch (e: any) {
      setToastType("error");
      setToast(e.message);
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleUpdateAssignment = async (
    assignmentId: string,
    patch: {
      title?: string;
      description?: string;
      status?: string;
      startDate?: string | null;
      dueDate?: string | null;
    }
  ) => {
    if (!ticket) return;
    setUpdatingId(assignmentId);
    try {
      await ticketsApi.updateAssignment(ticket.id, assignmentId, patch);
      setToastType("success");
      setToast("Tarea actualizada");
      refresh();
    } catch (e: any) {
      setToastType("error");
      setToast(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!ticket) return;
    try {
      await ticketsApi.removeAssignment(ticket.id, assignmentId);
      setToastType("success");
      setToast("Tarea retirada");
      refresh();
    } catch (e: any) {
      setToastType("error");
      setToast(e.message);
    }
  };

  const handleAddAssignmentComment = async (assignmentId: string) => {
    if (!ticket) return;
    const texto = commentDrafts[assignmentId]?.trim();
    if (!texto) return;
    setSendingCommentId(assignmentId);
    try {
      await ticketsApi.addAssignmentComment(ticket.id, assignmentId, texto);
      setCommentDrafts((d) => ({ ...d, [assignmentId]: "" }));
      setToastType("success");
      setToast("Comentario agregado");
      refresh();
    } catch (e: any) {
      setToastType("error");
      setToast(e.message);
    } finally {
      setSendingCommentId(null);
    }
  };

  const handleAddComment = async () => {
    if (!ticket || !commentText.trim()) return;
    setSendingComment(true);
    try {
      const action = await dispatch(
        addCommentThunk({ ticketId: ticket.id, texto: commentText.trim() })
      );
      if (addCommentThunk.fulfilled.match(action)) {
        setCommentText("");
        refresh();
        setToastType("success");
        setToast("Comentario agregado");
      }
    } finally {
      setSendingComment(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!ticket) return;
    setDownloadingPDF(true);
    try {
      await downloadTicketPDF(ticket);
      setToastType("success");
      setToast("PDF descargado");
    } catch {
      setToastType("error");
      setToast("Error al generar PDF");
    } finally {
      setDownloadingPDF(false);
    }
  };

  const empleadoOptions = empleados.map((u) => ({
    value: u.id,
    label: [u.name, u.numeroEmpleado ? `#${u.numeroEmpleado}` : null]
      .filter(Boolean)
      .join(" "),
  }));
  const responsableOptions = responsables.map((u) => ({
    value: u.id,
    label: [u.name, u.puesto, u.numeroEmpleado ? `#${u.numeroEmpleado}` : null].filter(Boolean).join(" · "),
  }));

  const renderGrafo = (canManage: boolean) => {
    if (!ticket) return null;
    const statusMeta: Record<string, { dot: string; bar: string; label: string }> = {
      PENDIENTE: { dot: "bg-slate-400", bar: "border-slate-300", label: "Pendiente" },
      EN_PROGRESO: { dot: "bg-blue-500", bar: "border-blue-400", label: "En progreso" },
      EN_REVISION: { dot: "bg-purple-500", bar: "border-purple-400", label: "En revisión" },
      COMPLETADA: { dot: "bg-emerald-500", bar: "border-emerald-400", label: "Completada" },
    };

    if (!tasksOpen) {
      return (
        <ITFlex justify="between" align="center" className="w-full rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
          <ITFlex align="center" gap={2}>
            <FaProjectDiagram size={14} className="text-emerald-600" />
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">Grafo de tareas</ITText>
            <ITBadget color="primary" size="small">{ticket.assignments.length}</ITBadget>
          </ITFlex>
          <ITButton variant="outlined" color="secondary" size="small" onClick={() => setTasksOpen(true)}>
            <ITText className="text-[10px] font-bold">Mostrar tareas</ITText>
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
              Grafo de tareas
            </ITText>
            <ITButton variant="outlined" color="secondary" size="small" onClick={() => setTasksOpen(false)}>
              <ITText className="text-[10px] font-bold">Ocultar tareas</ITText>
            </ITButton>
          </ITFlex>
          <ITBadget color="primary" size="small">
            {ticket.assignments.length} asignación(es)
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
              <ITBadget color={STATUS_BADGE[ticket.status]?.color as any ?? "default"} size="small">
                {STATUS_BADGE[ticket.status]?.label ?? ticket.status}
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
              Aún no hay empleados asignados a este ticket.
            </div>
          </div>
        ) : (
          ticket.assignments.map((a) => {
            const meta = statusMeta[a.status] ?? statusMeta.PENDIENTE;
            const assignmentOpen = expandedAssignments[a.id] ?? false;
            // Admin/gerente/jefe editan datos de la tarea; el empleado solo
            // mueve estado y comenta en las suyas.
            const canEditTask = canManage && !isClosed;
            const canEditStatus = !isClosed && (canManage || a.userId === currentUser?.id);
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
                            No. {a.user.numeroEmpleado}
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
                          onClick={() => handleRemoveAssignment(a.id)}
                          title="Retirar tarea"
                          disabled={updatingId === a.id}
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
                        {meta.label}
                      </ITBadget>
                      <ITButton
                        variant="outlined"
                        size="small"
                        color="secondary"
                        onClick={() => setExpandedAssignments((current) => ({ ...current, [a.id]: !assignmentOpen }))}
                      >
                        <ITText className="text-[10px] font-bold">{assignmentOpen ? "Ocultar" : "Abrir"}</ITText>
                      </ITButton>
                    </ITFlex>
                  </ITFlex>

                  {assignmentOpen && <ITStack direction="column" spacing={2}>
                    <ITInput
                      name={`title-${a.id}`}
                      label="Título"
                      value={a.title}
                      disabled={!canEditTask}
                      onChange={(e) => handleUpdateAssignment(a.id, { title: e.target.value })}
                    />

                    <ITTextarea
                      name={`desc-${a.id}`}
                      label="Descripción"
                      value={a.description}
                      disabled={!canEditTask}
                      rows={2}
                      onChange={(v) => handleUpdateAssignment(a.id, { description: v })}
                    />

                    <ITGrid container columns={12} spacing={2}>
                      <ITGrid item xs={12} sm={6}>
                        <ITDatePicker
                          name={`start-${a.id}`}
                          label="Fecha de inicio"
                          value={a.startDate ? new Date(a.startDate) : undefined}
                          disabled={!canEditTask}
                          onChange={(e: any) =>
                            handleUpdateAssignment(a.id, {
                              startDate: e.target.value ? e.target.value.toISOString() : null,
                            })
                          }
                        />
                      </ITGrid>
                      <ITGrid item xs={12} sm={6}>
                        <ITDatePicker
                          name={`due-${a.id}`}
                          label="Fecha de fin esperada"
                          value={a.dueDate ? new Date(a.dueDate) : undefined}
                          disabled={!canEditTask}
                          onChange={(e: any) =>
                            handleUpdateAssignment(a.id, {
                              dueDate: e.target.value ? e.target.value.toISOString() : null,
                            })
                          }
                        />
                      </ITGrid>
                    </ITGrid>

                    {canEditStatus && (
                      <ITSelect
                        name={`status-${a.id}`}
                        label="Estado de la tarea"
                        options={
                             isAdmin || isGerente
                            ? [
                                { value: "PENDIENTE", label: "Pendiente" },
                                { value: "EN_PROGRESO", label: "En progreso" },
                                { value: "EN_REVISION", label: "En revisión" },
                                { value: "COMPLETADA", label: "Completada" },
                              ]
                            : [
                                { value: "PENDIENTE", label: "Pendiente" },
                                { value: "EN_PROGRESO", label: "En progreso" },
                                { value: "EN_REVISION", label: "En revisión" },
                              ]
                        }
                        value={a.status}
                         disabled={!canEditStatus || (a.status === "COMPLETADA" && !isAdmin && !isGerente)}
                        onChange={(e) => handleUpdateAssignment(a.id, { status: e.target.value })}
                      />
                    )}

                    <TicketAttachments
                      ticketId={ticket.id}
                      assignmentId={a.id}
                      compact
                      canUpload={
                        isAdmin ||
                        isGerente ||
                        ticket.asignadoAId === currentUser?.id ||
                        (isJefeArea && ticket.creadoPorId === currentUser?.id) ||
                        a.userId === currentUser?.id
                      }
                    />

                    {/* Comentarios de la tarea */}
                    <div className="border-t border-slate-100 pt-2">
                      <ITButton
                        variant="outlined"
                        size="small"
                        color="secondary"
                        onClick={() =>
                          setCommentOpen((s) => ({ ...s, [a.id]: !s[a.id] }))
                        }
                      >
                        <ITFlex align="center" gap={1}>
                          <FaComment size={10} />
                          <ITText className="font-bold text-[10px]">
                            Comentarios ({a.comments?.length ?? 0})
                          </ITText>
                        </ITFlex>
                      </ITButton>

                      {commentOpen[a.id] && (
                        <div className="mt-2 space-y-2">
                          {(a.comments ?? []).length === 0 ? (
                            <ITText className="text-[10px] text-slate-400 italic">
                              Sin comentarios
                            </ITText>
                          ) : (
                            (a.comments ?? []).map((c) => (
                              <div
                                key={c.id}
                                className="rounded-lg bg-slate-50 border border-slate-100 p-2"
                              >
                                <ITFlex justify="between" align="center" className="mb-0.5">
                                  <ITText className="text-[9px] font-black text-slate-600">
                                    {c.autor?.name ?? "Sistema"}
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
                                placeholder="Agregar comentario..."
                                value={commentDrafts[a.id] ?? ""}
                                onChange={(e) =>
                                  setCommentDrafts((d) => ({
                                    ...d,
                                    [a.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  e.key === "Enter" && handleAddAssignmentComment(a.id)
                                }
                              />
                              <ITButton
                                variant="filled"
                                color="primary"
                                size="small"
                                onClick={() => handleAddAssignmentComment(a.id)}
                                disabled={
                                  sendingCommentId === a.id ||
                                  !(commentDrafts[a.id] ?? "").trim()
                                }
                              >
                                <FaPaperPlane size={11} />
                              </ITButton>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </ITStack>}
                </div>
              </div>
            );
          })
        )}

        {/* Agregar nodo (empleado + tarea) — solo admin */}
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
                  <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-600">Nueva tarea</ITText>
                </ITFlex>
                <ITButton variant="outlined" color="secondary" size="small" onClick={() => setNewTaskOpen((open) => !open)}>
                  <ITText className="text-[10px] font-bold">{newTaskOpen ? "Ocultar" : "Abrir formulario"}</ITText>
                </ITButton>
              </ITFlex>
              {newTaskOpen && <ITGrid container columns={12} spacing={3}>
                <ITGrid item xs={12} md={7}>
                  <ITSearchSelect
                    name="newUserId"
                    label="Empleado"
                    placeholder="Buscar por nombre o no. empleado..."
                    options={empleadoOptions}
                    value={selectedUserId}
                    onChange={handleAssign}
                    onSearch={buscarEmpleados}
                    isLoading={busyEmpleados}
                  />
                </ITGrid>
                <ITGrid item xs={12} md={5}>
                  <ITInput
                    name="taskTitle"
                    label="Título de la tarea"
                    placeholder="Ej. Revisar instalación eléctrica"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddAssignment()}
                  />
                </ITGrid>
                <ITGrid item xs={12}>
                  <ITTextarea
                    name="taskDesc"
                    label="Descripción"
                    placeholder="Detalles de la tarea..."
                    rows={2}
                    value={taskDesc}
                    onChange={(v) => setTaskDesc(v)}
                  />
                </ITGrid>
                <ITGrid item xs={12} sm={6}>
                  <ITDatePicker
                    name="taskStart"
                    label="Fecha de inicio"
                    value={taskStart ? new Date(taskStart) : undefined}
                    onChange={(e: any) =>
                      setTaskStart(
                        e.target.value ? e.target.value.toISOString() : ""
                      )
                    }
                  />
                </ITGrid>
                <ITGrid item xs={12} sm={6}>
                  <ITDatePicker
                    name="taskDue"
                    label="Fecha de fin esperada"
                    value={taskDue ? new Date(taskDue) : undefined}
                    onChange={(e: any) =>
                      setTaskDue(
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
                      onClick={handleAddAssignment}
                      disabled={savingAssignment || !selectedUserId || !taskTitle.trim()}
                    >
                      <ITFlex align="center" gap={1}>
                        <FaPlus size={12} />
                        <ITText className="font-bold text-[11px]">Asignar</ITText>
                      </ITFlex>
                    </ITButton>
                  </ITFlex>
                </ITGrid>
              </ITGrid>}
            </div>
          </div>
        )}
      </ITStack>
    );
  };

  if (!ticket) {
    return (
      <ITPage
        title="Ticket"
        backAction={() => navigate(-1)}
        icon={<FaTicketAlt size={20} />}
        breadcrumbs={[
          { label: "Tickets", onClick: () => navigate("/tickets") },
          { label: "Ticket" },
        ]}
      >
        <ITText className="text-slate-400">Cargando...</ITText>
      </ITPage>
    );
  }

  const isClosed = ticket.status === "CERRADO";

  const getHistoryMeta = (h: typeof ticket.history[0]) => {
    if (h.type === "CREATED") return { icon: <FaTicketAlt size={10} />, bg: "bg-emerald-500", color: "text-emerald-600" };
    if (h.type === "STATUS") {
      if (h.detail?.includes("CERRADO")) return { icon: <FaTimesCircle size={10} />, bg: "bg-red-500", color: "text-red-600" };
      if (h.detail?.includes("EN_SEGUIMIENTO")) return { icon: <FaSync size={10} />, bg: "bg-blue-500", color: "text-blue-600" };
      return { icon: <FaCheckCircle size={10} />, bg: "bg-sky-500", color: "text-sky-600" };
    }
    if (h.type === "PRIORITY") return { icon: <FaClock size={10} />, bg: "bg-amber-500", color: "text-amber-600" };
    if (h.type === "ASSIGNED") return { icon: <FaUserPlus size={10} />, bg: "bg-violet-500", color: "text-violet-600" };
    if (h.type === "DEPARTMENT") return { icon: <FaBuilding size={10} />, bg: "bg-purple-500", color: "text-purple-600" };
    return { icon: <FaClock size={10} />, bg: "bg-slate-400", color: "text-slate-500" };
  };

  const timelineEvents: TimelineEvent[] = [];

  ticket.history.forEach((h) => {
    const meta = getHistoryMeta(h);
    timelineEvents.push({
      id: h.id,
      type: h.type.toLowerCase() as any,
      icon: meta.icon,
      iconBg: meta.bg,
      title: h.detail ?? h.type,
      author: h.autor?.name ?? "Sistema",
      timestamp: h.createdAt,
    });
  });

  ticket.comments.forEach((c) => {
    timelineEvents.push({
      id: c.id,
      type: "comment",
      icon: <FaComment size={10} />,
      iconBg: "bg-slate-400",
      title: c.autor?.name ?? "Usuario",
      detail: c.texto,
      author: c.autor?.name ?? "Usuario",
      timestamp: c.creadoEn,
    });
  });

  timelineEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const calculateEfficacy = () => {
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
    let score: number;
    if (hours <= t.excellent) score = 100;
    else if (hours <= t.good) score = 80;
    else if (hours <= t.fair) score = 60;
    else score = 40;

    const label = score === 100 ? "Excelente" : score === 80 ? "Bueno" : score === 60 ? "Regular" : "Bajo";
    return { score, label, hours: Math.round(hours * 10) / 10 };
  };

  const efficacy = calculateEfficacy();

  return (
    <ITPage
      title={ticket.titulo}
      description={`${STATUS_LABELS[ticket.status] ?? ticket.status} · ${CATEGORY_LABELS[ticket.category] ?? ticket.category}`}
      backAction={() => navigate(-1)}
      icon={<FaTicketAlt size={20} />}
      breadcrumbs={[
        { label: "Tickets", onClick: () => navigate("/tickets") },
        { label: ticket.titulo },
      ]}
      actions={
        <ITFlex gap={2} wrap="wrap">
           {(isAdmin || isGerente || canCreateTasks) && <ITButton
            variant="outlined"
            size="small"
            color="secondary"
            onClick={() => navigate(`/tickets/kanban?ticketId=${ticket.id}`)}
            title="Seguimiento kanban de las tareas de este ticket"
          >
            <ITFlex align="center" gap={1}>
              <FaTrello size={12} />
              <ITText className="font-bold text-[11px]">Seguimiento kanban</ITText>
            </ITFlex>
          </ITButton>}
           <ITButton
            variant="outlined"
            size="small"
            color="primary"
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
          >
            <ITFlex align="center" gap={1}>
              <FaFilePdf size={12} />
              <ITText className="font-bold text-[11px]">
                {downloadingPDF ? "Generando..." : "PDF"}
              </ITText>
            </ITFlex>
           </ITButton>
           {!isClosed && (isAdmin || isGerente) && (
            <ITButton variant="filled" size="small" color="danger" onClick={() => handleStatusChange("CERRADO")}>
              <ITFlex align="center" gap={1}>
                <FaTimesCircle size={12} />
                <ITText className="font-bold text-[11px]">Finalizar</ITText>
              </ITFlex>
            </ITButton>
          )}
           {isAdmin && <ITButton
            variant="outlined"
            size="small"
            color="danger"
            onClick={() => setDeleteOpen(true)}
            title={ticket.deletedAt ? "Eliminar definitivamente" : "Mover a papelera"}
          >
            {ticket.deletedAt ? <FaTrashRestore size={12} /> : <FaTrash size={12} />}
           </ITButton>}
        </ITFlex>
      }
    >
      <div className="flex flex-col md:flex-row gap-5 items-start">
        {/* ── Columna izquierda: contenido principal ── */}
        <div className="flex-1 flex flex-col gap-5">
          {/* Info del ticket */}
          <ITFlex className="bg-white rounded-2xl md:rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-4 sm:p-6 lg:p-8">
            <ITStack direction="column" spacing={5} className="w-full">
              <ITFlex gap={2} wrap="wrap">
                <ITBadget color={STATUS_BADGE[ticket.status]?.color as any ?? "default"} size="small">
                  {STATUS_BADGE[ticket.status]?.label ?? ticket.status}
                </ITBadget>
                <ITBadget color={PRIORITY_BADGE[ticket.priority]?.color as any ?? "default"} size="small">
                  {PRIORITY_BADGE[ticket.priority]?.label ?? ticket.priority}
                </ITBadget>
                <ITBadget color="primary" size="small">
                  {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                </ITBadget>
                {ticket.deletedAt && (
                  <ITBadget color="gray" size="small">Eliminado</ITBadget>
                )}
              </ITFlex>

              <ITStack direction="column" spacing={2}>
                <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  Descripcion
                </ITText>
                <ITText className="text-[13px] text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                  {ticket.descripcion}
                </ITText>
              </ITStack>

              <TicketAttachments
                ticketId={ticket.id}
                 canUpload={isAdmin || isGerente || isInvolved || (isJefeArea && ticket.creadoPorId === currentUser?.id)}
              />

              <ITGrid container columns={12} spacing={3}>
                <ITGrid item xs={12} sm={6} md={4}>
                  <ITStack direction="column" spacing={1}>
                    <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Creado por
                    </ITText>
                    <ITText className="text-[12px] font-bold text-slate-700 truncate">
                      {ticket.creadoPor?.name ?? "—"}
                    </ITText>
                    <ITText className="text-[9px] text-slate-400">
                      {formatFechaHora(ticket.creadoEn)}
                    </ITText>
                  </ITStack>
                </ITGrid>
                <ITGrid item xs={12} sm={6} md={4}>
                  <ITStack direction="column" spacing={1}>
                    <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Asignado a
                    </ITText>
                    <ITText className="text-[12px] font-bold text-slate-700 truncate">
                      {ticket.asignadoA?.name ?? "Sin asignar"}
                    </ITText>
                  </ITStack>
                </ITGrid>
                <ITGrid item xs={12} sm={6} md={4}>
                  <ITStack direction="column" spacing={1}>
                    <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Departamento
                    </ITText>
                    <ITText className="text-[12px] font-bold text-slate-700 truncate">
                      {ticket.department?.name ?? "—"}
                    </ITText>
                  </ITStack>
                </ITGrid>
              </ITGrid>

              {efficacy && (
                <ITFlex className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <ITStack direction="column" spacing={1} className="flex-1">
                    <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Eficacia de resolución
                    </ITText>
                    <ITFlex align="center" gap={2}>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            efficacy.score === 100 ? "bg-emerald-500" : efficacy.score === 80 ? "bg-blue-500" : efficacy.score === 60 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${efficacy.score}%` }}
                        />
                      </div>
                      <ITFlex align="center" gap={1}>
                        <ITText className={`text-[13px] font-black ${
                          efficacy.score === 100 ? "text-emerald-600" : efficacy.score === 80 ? "text-blue-600" : efficacy.score === 60 ? "text-amber-600" : "text-red-600"
                        }`}>
                          {efficacy.score}%
                        </ITText>
                        <ITText className={`text-[9px] font-bold ${
                          efficacy.score === 100 ? "text-emerald-500" : efficacy.score === 80 ? "text-blue-500" : efficacy.score === 60 ? "text-amber-500" : "text-red-500"
                        }`}>
                          {efficacy.label}
                        </ITText>
                      </ITFlex>
                    </ITFlex>
                    <ITText className="text-[9px] text-slate-400">
                      Resuelto en {efficacy.hours}h
                    </ITText>
                  </ITStack>
                </ITFlex>
              )}
            </ITStack>
          </ITFlex>

          {/* Admin/Jefe panel */}
           {(canEditTicket || canCreateTasks) && (
            <ITFlex className="bg-white rounded-2xl md:rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-4 sm:p-6 lg:p-8">
              <ITStack direction="column" spacing={4} className="w-full">
                <ITFlex align="center" gap={2}>
                  <FaUserCog size={14} className="text-slate-400" />
                  <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                    Administrar ticket
                  </ITText>
                </ITFlex>

                 {isAdmin && (
                  <ITGrid container columns={12} spacing={3}>
                    <ITGrid item xs={12} sm={4}>
                      <ITSelect
                        name="status"
                        label="Estado"
                        options={[
                          { value: "ABIERTO", label: "Abierto" },
                          { value: "EN_SEGUIMIENTO", label: "En seguimiento" },
                          { value: "CERRADO", label: "Cerrado" },
                        ]}
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={isClosed}
                      />
                    </ITGrid>
                    <ITGrid item xs={12} sm={4}>
                      <ITSelect
                        name="category"
                        label="Categoría"
                        options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
                          value,
                          label,
                        }))}
                        value={ticket.category}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        disabled={isClosed}
                      />
                    </ITGrid>
                    <ITGrid item xs={12} sm={4}>
                      <ITSelect
                        name="department"
                        label="Departamento"
                        options={[
                          { value: "", label: "Sin asignar" },
                          ...departments.map((d) => ({ value: d.id, label: d.name })),
                        ]}
                        value={ticket.departmentId ?? ""}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                        disabled={isClosed}
                      />
                    </ITGrid>
                  </ITGrid>
                 )}

                 {(isAdmin || isGerente) && (
                   <ITSelect
                     name="responsable"
                     label="Responsable"
                     options={[
                       { value: "", label: "Sin responsable" },
                       ...responsableOptions,
                     ]}
                     value={ticket.asignadoAId ?? ""}
                     onChange={(e) => handleResponsibleChange(e.target.value)}
                     disabled={isClosed}
                   />
                 )}

                 {renderGrafo(true)}
              </ITStack>
            </ITFlex>
          )}

          {/* Grafo para involucrados (empleados): ven sus tareas y pueden
              marcar su propio estado. */}
          {!canEditTicket && !canCreateTasks && isInvolved && (
            <ITFlex className="bg-white rounded-2xl md:rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-4 sm:p-6 lg:p-8">
              {renderGrafo(false)}
            </ITFlex>
          )}

         {/* Comentarios */}
          <div className="bg-white rounded-2xl md:rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-4 sm:p-6 lg:p-8">
              <ITStack direction="column" spacing={3} className="w-full">
                <ITFlex align="center" gap={2}>
                  <FaComment size={14} className="text-slate-400" />
                  <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                    {isClosed ? "Comentarios (solo lectura)" : "Agregar comentario"}
                  </ITText>
                </ITFlex>

                {/* Caja contenedora tipo editor/card */}
                <div className={`w-full border border-slate-200 rounded-xl p-3 transition-all ${isClosed ? "bg-slate-50" : "bg-slate-50/70 focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"}`}>
                  <ITTextarea
                    name="comment"
                    value={commentText}
                    onChange={(v) => setCommentText(v)}
                    placeholder={isClosed ? "Este ticket está cerrado" : "Escribe un comentario o seguimiento para este ticket..."}
                    rows={3}
                    disabled={isClosed}
                    className="w-full bg-transparent resize-none border-none p-0 focus:ring-0 text-[13px] text-slate-700 placeholder:text-slate-400"
                  />

                  {/* Barra inferior de acciones */}
                  {!isClosed && (
                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-200/60">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {commentText.trim().length > 0 ? `${commentText.trim().length} caracteres` : "Seguimiento público"}
                      </span>
                      
                      <ITButton
                        variant="filled"
                        color="primary"
                        size="small"
                        onClick={handleAddComment}
                        disabled={sendingComment || !commentText.trim()}
                        className="px-4 py-1.5 h-auto rounded-lg shadow-sm font-semibold transition-all active:scale-95"
                      >
                        <ITFlex align="center" gap={1.5}>
                          <FaPaperPlane size={11} />
                          <span className="text-[11px]">
                            {sendingComment ? "Enviando..." : "Comentar"}
                          </span>
                        </ITFlex>
                      </ITButton>
                    </div>
                  )}

                </div>
              </ITStack>
            </div>
        </div>

        {/* ── Columna derecha: historial (aside lateral) ── */}
        <aside className="shrink-0">
          <div className="bg-white rounded-2xl md:rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-4 sm:p-6 md:sticky md:top-24">
            <ITFlex align="center" gap={2} className="mb-5">
              <FaClock size={14} className="text-slate-400" />
              <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Historial ({timelineEvents.length})
              </ITText>
            </ITFlex>

            {timelineEvents.length === 0 ? (
              <ITText className="text-[12px] text-slate-400 italic">
                Sin actividad aun
              </ITText>
            ) : (
              <div className="space-y-0 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                {[...timelineEvents].reverse().map((event, idx) => {
                  const isComment = event.type === "comment";
                  const isLast = idx === 0;

                  return (
                    <div key={event.id} className="flex gap-3 relative">
                      {/* Línea vertical */}
                      {!isLast && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 to-slate-100" />
                      )}

                      {/* Dot */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center ${event.iconBg} text-white z-10 ring-2 ring-white shrink-0 shadow-sm`}
                      >
                        {event.icon}
                      </div>

                      {/* Contenido */}
                      <div className={`pb-5 min-w-0 flex-1 ${isLast ? "pb-0" : ""}`}>
                        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 mb-1">
                            <span className={`text-[11px] font-bold leading-tight ${
                              event.title.includes("CERRADO") ? "text-red-600" : "text-slate-700"
                            }`}>
                              {event.title}
                            </span>
                            <span className="text-[9px] text-slate-400 tabular-nums whitespace-nowrap bg-white px-1.5 py-0.5 rounded">
                              {formatFechaHora(event.timestamp)}
                            </span>
                          </div>
                          {event.detail && (
                            <p className={`text-[11px] leading-snug break-words ${
                              isComment ? "text-slate-600 italic" : "text-slate-500"
                            }`}>
                              {isComment ? `"${event.detail}"` : event.detail}
                            </p>
                          )}
                          {event.author && (
                            <span className="text-[9px] text-slate-400 mt-1 block">
                              {event.author}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>

      {toast && (
        <ITToast
          message={toast}
          type={toastType}
          position="bottom-center"
          duration={2500}
          onClose={() => setToast(null)}
        />
      )}

      <ITConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteTicket}
        title={ticket.deletedAt ? "Eliminar definitivamente" : "Mover a papelera"}
        message={
          ticket.deletedAt
            ? `¿Eliminar definitivamente "${ticket.titulo}"? Se borrarán sus comentarios e historial. Esta acción no se puede deshacer.`
            : `¿Mover a papelera "${ticket.titulo}"? Quedará en estado eliminado y podrás borrarlo definitivamente después.`
        }
        confirmLabel={ticket.deletedAt ? "Eliminar definitivamente" : "Mover a papelera"}
        cancelLabel="Cancelar"
        variant="danger"
      />
    </ITPage>
  );
}
