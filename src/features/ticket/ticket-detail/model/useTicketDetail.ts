import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n/dyn";
import type { AppDispatch, RootState } from "@app/store";
import {
  fetchTicketById,
  updateTicketThunk,
  addCommentThunk,
  clearCurrent,
  ticketsApi,
  type Ticket,
  type TicketCategory,
} from "@entities/ticket";
import type { PermissionScope, User, UserRole } from "@entities/user";
import { usersApi, usePermission } from "@entities/user";
import { departmentsApi, type Department } from "@entities/department";
import { useAblyChannel } from "@shared/lib/ably";
import { todayInput } from "./timeline";
import { i18n } from "@shared/i18n";

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

  const scopeEdit = usePermission("tickets.edit");
  const scopeClose = usePermission("tickets.close");
  const scopeAssign = usePermission("tasks.assign");
  const scopeComplete = usePermission("tasks.complete");
  const scopeDelete = usePermission("tickets.delete");

  const isCreator = !!ticket && ticket.createdById === currentUser?.id;
  const isAssignee = !!ticket && ticket.assignedToId === currentUser?.id;
  const isSameDepartment =
    !!ticket &&
    !!currentUser?.departmentId &&
    ticket.departmentId === currentUser.departmentId;
  const isInvolved =
    !!ticket &&
    (isCreator ||
      isAssignee ||
      ticket.assignments.some((a) => a.userId === currentUser?.id));
  const isClosed = ticket?.status === "CLOSED";

  /**
   * Alcance sobre el registro: TODO siempre; AREA incluye lo propio y su
   * departamento; PROPIO solo lo propio (ver ROLES_Y_PERMISOS.md §2).
   */
  const scopeAllows = (scope: PermissionScope, own: boolean): boolean =>
    scope === "ALL" ||
    (scope === "AREA" && (own || isSameDepartment)) ||
    (scope === "OWN" && own);

  const canEditTicket = scopeAllows(scopeEdit, isCreator);
  const canClose = scopeAllows(scopeClose, isCreator);
  const canCreateTasks =
    Boolean(ticket) && scopeAllows(scopeAssign, isCreator || isAssignee);
  const canCompleteTask = scopeAllows(scopeComplete, isCreator || isAssignee);
  const canDeleteTicket = scopeDelete !== "NONE";
  const canUploadToTicket = canEditTicket || isInvolved;

  const [employees, setEmployees] = useState<User[]>([]);
  const [assignees, setAssignees] = useState<User[]>([]);
  const [busyEmployees, setBusyEmployees] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
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
      .employees()
      .then(setEmployees)
      .catch(() => setEmployees([]));
    usersApi
      .employeesByRoles(["ADMIN", "MANAGER", "AREA_HEAD", "EMPLOYEE"] as UserRole[])
      .then(setAssignees)
      .catch(() => setAssignees([]));
  }, []);

  useEffect(() => {
    departmentsApi.list().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    ticketsApi.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const searchEmployees = async (q?: string) => {
    setBusyEmployees(true);
    try {
      const res = await usersApi.employees(undefined, q || undefined);
      setEmployees(res);
    } catch {
      setEmployees([]);
    } finally {
      setBusyEmployees(false);
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
          status: dyn(tt)(`statusLabels.${newStatus}`) ?? newStatus,
        })
      );
    }
  };

  const handleCategoryChange = async (newCategoryId: string) => {
    if (!ticket) return;
    const action = await dispatch(
      updateTicketThunk({ id: ticket.id, data: { categoryId: newCategoryId || null } })
    );
    if (updateTicketThunk.fulfilled.match(action)) {
      refresh();
      setToastType("success");
      setToast(
        tt("detail.categoryChanged", {
          category:
            categories.find((c) => c.id === newCategoryId)?.name ?? newCategoryId,
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
        tt("detail.departmentChanged", { department: dept?.name ?? i18n.t("common:labels.unassigned") })
      );
    }
  };

  const handleResponsibleChange = async (userId: string) => {
    if (!ticket) return;
    const action = await dispatch(
      updateTicketThunk({ id: ticket.id, data: { assignedToId: userId || null } })
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
    const text = commentDrafts[assignmentId]?.trim();
    if (!text) return;
    setSendingCommentId(assignmentId);
    try {
      await ticketsApi.addAssignmentComment(ticket.id, assignmentId, text);
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
        addCommentThunk({ ticketId: ticket.id, text: commentText.trim() })
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

  const employeeOptions = employees.map((u) => ({
    value: u.id,
    label: [u.name, u.employeeNumber ? `#${u.employeeNumber}` : null]
      .filter(Boolean)
      .join(" "),
  }));

  const assigneeOptions = assignees.map((u) => ({
    value: u.id,
    label: [u.name, u.jobTitle, u.employeeNumber ? `#${u.employeeNumber}` : null]
      .filter(Boolean)
      .join(" · "),
  }));

  return {
    ticket,
    currentUser,
    canEditTicket,
    canCreateTasks,
    canCompleteTask,
    canDeleteTicket,
    canUploadToTicket,
    isInvolved,
    isClosed,
    canClose,
    employeeOptions,
    assigneeOptions,
    busyEmployees,
    departments,
    categories,
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
    searchEmployees,
    refresh,
  };
};

export type UseTicketDetail = ReturnType<typeof useTicketDetail>;