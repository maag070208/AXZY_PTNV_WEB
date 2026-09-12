import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import type { AppDispatch, RootState } from "@app/store";
import {
  fetchTicketById,
  updateTicketThunk,
  addCommentThunk,
  clearCurrent,
  ticketsApi,
  type Ticket,
} from "@entities/ticket";
import type { User, UserRole } from "@entities/user";
import { usersApi } from "@entities/user";
import { departmentsApi, type Department } from "@entities/department";
import { useAblyChannel } from "@shared/lib/ably";
import { todayInput } from "./timeline";

interface Props {
  id?: string;
  download?: (ticket: Ticket) => Promise<void>;
  onDeleted?: () => void;
}

export const useTicketDetail = ({ id, download, onDeleted }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { t: tt } = useTranslation("tickets");

  const ticket = useSelector((s: RootState) => s.tickets.current);
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = currentUser?.role === "ADMIN";
  const isGerente = currentUser?.role === "GERENTE";
  const isJefeArea = currentUser?.role === "JEFE_DE_AREA";
  const canEditTicket =
    isAdmin || isGerente || (isJefeArea && ticket?.creadoPorId === currentUser?.id);
  const canCreateTasks = Boolean(
    ticket &&
      (isAdmin ||
        ticket.creadoPorId === currentUser?.id ||
        ticket.asignadoAId === currentUser?.id)
  );
  const isInvolved =
    !!ticket &&
    (ticket.creadoPorId === currentUser?.id ||
      ticket.asignadoAId === currentUser?.id ||
      ticket.assignments.some((a) => a.userId === currentUser?.id));
  const isClosed = ticket?.status === "CERRADO";

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
  const [expandedAssignments, setExpandedAssignments] = useState<
    Record<string, boolean>
  >({});
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
      onDeleted?.();
    } catch (e: any) {
      setToastType("error");
      setToast(e.message);
      setDeleteOpen(false);
    }
  };

  useEffect(() => {
    if (id) dispatch(fetchTicketById(id));
    return () => {
      dispatch(clearCurrent());
    };
  }, [id, dispatch]);

  useAblyChannel(id ? `tickets:${id}` : undefined, {
    COMMENT: (data) => {
      if ((data as { comment?: unknown } | null)?.comment) {
        dispatch(fetchTicketById(id!));
      }
    },
  });

  useEffect(() => {
    usersApi
      .empleados()
      .then(setEmpleados)
      .catch(() => setEmpleados([]));
    usersApi
      .empleadosPorRoles(["ADMIN", "GERENTE", "JEFE_DE_AREA", "EMPLEADO"] as UserRole[])
      .then(setResponsables)
      .catch(() => setResponsables([]));
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

  const refresh = useCallback(() => {
    if (id) dispatch(fetchTicketById(id));
  }, [id, dispatch]);

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    const action = await dispatch(
      updateTicketThunk({ id: ticket.id, data: { status: newStatus } })
    );
    if (updateTicketThunk.fulfilled.match(action)) {
      refresh();
      setToastType("success");
      setToast(
        tt("detail.statusChanged", {
          status:
            { ABIERTO: "Abierto", EN_SEGUIMIENTO: "En seguimiento", CERRADO: "Cerrado" }[
              newStatus
            ] ?? newStatus,
        })
      );
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
      setToast(
        tt("detail.categoryChanged", {
          category:
            {
              MANTENIMIENTO: "Mantenimiento",
              EQUIPO: "Equipo",
              SISTEMA: "Sistema",
              OTRO: "Otro",
            }[newCategory] ?? newCategory,
        })
      );
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
      setToast(
        tt("detail.departmentChanged", { department: dept?.name ?? "Sin asignar" })
      );
    }
  };

  const handleResponsibleChange = async (userId: string) => {
    if (!ticket) return;
    const action = await dispatch(
      updateTicketThunk({ id: ticket.id, data: { asignadoAId: userId || null } })
    );
    if (updateTicketThunk.fulfilled.match(action)) {
      refresh();
      setToastType("success");
      setToast(
        userId ? tt("detail.responsibleAssigned") : tt("detail.responsibleUnassigned")
      );
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
      setToast(tt("detail.taskAssigned"));
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
      setToast(tt("detail.taskUpdated"));
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
      setToast(tt("detail.taskRemoved"));
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
      setToast(tt("detail.commentAdded"));
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
        setToast(tt("detail.commentAdded"));
      }
    } finally {
      setSendingComment(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!ticket || !download) return;
    setDownloadingPDF(true);
    try {
      await download(ticket);
      setToastType("success");
      setToast(tt("detail.pdfDownloaded"));
    } catch {
      setToastType("error");
      setToast(tt("detail.pdfError"));
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
    label: [u.name, u.puesto, u.numeroEmpleado ? `#${u.numeroEmpleado}` : null]
      .filter(Boolean)
      .join(" · "),
  }));

  return {
    ticket,
    currentUser,
    isAdmin,
    isGerente,
    isJefeArea,
    canEditTicket,
    canCreateTasks,
    isInvolved,
    isClosed,
    empleadoOptions,
    responsableOptions,
    busyEmpleados,
    departments,
    commentText,
    setCommentText,
    toast,
    toastType,
    setToast,
    sendingComment,
    downloadingPDF,
    deleteOpen,
    setDeleteOpen,
    selectedUserId,
    setSelectedUserId,
    taskTitle,
    setTaskTitle,
    taskDesc,
    setTaskDesc,
    taskStart,
    setTaskStart,
    taskDue,
    setTaskDue,
    tasksOpen,
    setTasksOpen,
    newTaskOpen,
    setNewTaskOpen,
    expandedAssignments,
    setExpandedAssignments,
    savingAssignment,
    updatingId,
    commentOpen,
    setCommentOpen,
    commentDrafts,
    setCommentDrafts,
    sendingCommentId,
    handleDeleteTicket,
    handleStatusChange,
    handleCategoryChange,
    handleDepartmentChange,
    handleResponsibleChange,
    handleAssign,
    handleAddAssignment,
    handleUpdateAssignment,
    handleRemoveAssignment,
    handleAddAssignmentComment,
    handleAddComment,
    handleDownloadPDF,
    buscarEmpleados,
    refresh,
  };
};

export type UseTicketDetail = ReturnType<typeof useTicketDetail>;