import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import type { RootState } from "@app/store";
import { usersApi, type User } from "@entities/user";
import {
  ticketsApi,
  type KanbanAssignment,
  type Ticket,
} from "@entities/ticket";
import type { Status } from "@shared/ui/kanban";

const COLUMNS: Array<{ status: Status }> = [
  { status: "PENDIENTE" },
  { status: "EN_PROGRESO" },
  { status: "EN_REVISION" },
  { status: "COMPLETADA" },
];

export const useKanban = (ticketId?: string) => {
  const { t: tt } = useTranslation("tickets");
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = currentUser?.role === "ADMIN";
  const isEmpleado = currentUser?.role === "EMPLEADO";
  const isGerente = currentUser?.role === "GERENTE";
  const canCreate = !isEmpleado;

  const [rows, setRows] = useState<KanbanAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [modalTicket, setModalTicket] = useState<Ticket | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [employees, setEmployees] = useState<User[]>([]);
  const [busyEmployees, setBusyEmployees] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [ticketOptions, setTicketOptions] = useState<Ticket[]>([]);
  const [busyTickets, setBusyTickets] = useState(false);
  const [createTicketId, setCreateTicketId] = useState("");
  const [createUserId, setCreateUserId] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createStart, setCreateStart] = useState("");
  const [createDue, setCreateDue] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Status | null>(null);
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    ticketsApi
      .kanban(ticketId)
      .then((res) => setRows(res.data.filter((a) => !a.ticket.deletedAt)))
      .catch((e: any) => setError(e.message ?? tt("kanban.loadError")))
      .finally(() => setLoading(false));
  }, [ticketId, tt]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    usersApi.empleados().then(setEmployees).catch(() => setEmployees([]));
  }, []);

  useEffect(() => {
    ticketsApi
      .list()
      .then((res) => setTicketOptions(res.data))
      .catch(() => setTicketOptions([]));
  }, []);

  const uniqueAssignees = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    rows.forEach((r) => {
      if (!map.has(r.userId)) map.set(r.userId, { id: r.userId, name: r.user.name });
    });
    return Array.from(map.values());
  }, [rows]);

  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(r.ticket.department?.name ?? tt("list.general")));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows, tt]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (assigneeFilter && r.userId !== assigneeFilter) return false;
      const deptName = r.ticket.department?.name ?? tt("list.general");
      if (departmentFilter && deptName !== departmentFilter) return false;
      if (
        q &&
        !r.title.toLowerCase().includes(q) &&
        !r.ticket.titulo.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [rows, assigneeFilter, departmentFilter, search, tt]);

  const byStatus = useMemo(
    () =>
      COLUMNS.reduce(
        (acc, c) => {
          acc[c.status] = filteredRows.filter((r) => r.status === c.status);
          return acc;
        },
        {} as Record<Status, KanbanAssignment[]>
      ),
    [filteredRows]
  );

  const hasActiveFilters = Boolean(
    assigneeFilter || departmentFilter || search.trim()
  );

  const clearFilters = () => {
    setAssigneeFilter(null);
    setDepartmentFilter("");
    setSearch("");
  };

  const openTicket = async (id: string) => {
    setModalLoading(true);
    setModalTicket(null);
    try {
      const t = await ticketsApi.get(id);
      setModalTicket(t);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleSearchEmployees = async (query?: string) => {
    setBusyEmployees(true);
    try {
      setEmployees(await usersApi.empleados(undefined, query || undefined));
    } catch {
      setEmployees([]);
    } finally {
      setBusyEmployees(false);
    }
  };

  const handleSearchTickets = async (query?: string) => {
    setBusyTickets(true);
    try {
      const res = await ticketsApi.list(query || undefined);
      setTicketOptions(res.data);
    } catch {
      setTicketOptions([]);
    } finally {
      setBusyTickets(false);
    }
  };

  const resetCreateForm = () => {
    setCreateTicketId("");
    setCreateUserId("");
    setCreateTitle("");
    setCreateDescription("");
    setCreateStart("");
    setCreateDue("");
  };

  const handleCreateTask = async () => {
    if (!createTicketId || !createUserId || !createTitle.trim()) return;
    setCreatingTask(true);
    try {
      await ticketsApi.addAssignment(createTicketId, {
        userId: createUserId,
        title: createTitle.trim(),
        description: createDescription.trim(),
        startDate: createStart || null,
        dueDate: createDue || null,
      });
      resetCreateForm();
      setShowCreatePanel(false);
      if (modalTicket && modalTicket.id === createTicketId) {
        const updatedTicket = await ticketsApi.get(modalTicket.id);
        setModalTicket(updatedTicket);
      }
      setReloadKey((key) => key + 1);
      setToast(tt("kanban.taskAssigned"));
    } catch (e: any) {
      setError(e.message ?? tt("kanban.assignError"));
    } finally {
      setCreatingTask(false);
    }
  };

  const employeeOptions = employees.map((employee) => ({
    value: employee.id,
    label: [
      employee.name,
      employee.numeroEmpleado ? `#${employee.numeroEmpleado}` : null,
    ]
      .filter(Boolean)
      .join(" "),
  }));

  const ticketSelectOptions = ticketOptions.map((t) => ({
    value: t.id,
    label: `${t.titulo} · #${t.id.slice(0, 8).toUpperCase()}`,
  }));

  const canManageModalTicket = Boolean(
    modalTicket &&
      (isAdmin ||
        isGerente ||
        modalTicket.creadoPorId === currentUser?.id ||
        modalTicket.asignadoAId === currentUser?.id)
  );

  const handleStatusChange = async (assignment: KanbanAssignment, status: Status) => {
    try {
      await ticketsApi.updateAssignment(assignment.ticketId, assignment.id, {
        status,
      });
      setRows((prev) =>
        prev.map((r) => (r.id === assignment.id ? { ...r, status } : r))
      );
      if (modalTicket) {
        const t = await ticketsApi.get(assignment.ticketId);
        setModalTicket(t);
      }
      setToast(tt("kanban.taskMoved"));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDrop = (status: Status) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/plain");
    const assignment = rows.find((r) => r.id === id);
    if (!assignment || assignment.status === status) {
      setDraggingId(null);
      return;
    }
    if (status === "COMPLETADA" && !isAdmin && !isGerente) {
      setToast(tt("kanban.completeRestricted"));
      setDraggingId(null);
      return;
    }
    handleStatusChange(assignment, status);
    setDraggingId(null);
  };

  return {
    COLUMNS,
    currentUser,
    isAdmin,
    isGerente,
    isEmpleado,
    canCreate,
    rows,
    loading,
    error,
    reloadKey,
    toast,
    setToast,
    modalTicket,
    setModalTicket,
    modalLoading,
    employees,
    busyEmployees,
    showCreatePanel,
    setShowCreatePanel,
    ticketOptions,
    busyTickets,
    createTicketId,
    setCreateTicketId,
    createUserId,
    setCreateUserId,
    createTitle,
    setCreateTitle,
    createDescription,
    setCreateDescription,
    createStart,
    setCreateStart,
    createDue,
    setCreateDue,
    creatingTask,
    draggingId,
    setDraggingId,
    dragOver,
    setDragOver,
    search,
    setSearch,
    assigneeFilter,
    setAssigneeFilter,
    departmentFilter,
    setDepartmentFilter,
    uniqueAssignees,
    departmentOptions,
    byStatus,
    hasActiveFilters,
    clearFilters,
    employeeOptions,
    ticketSelectOptions,
    canManageModalTicket,
    openTicket,
    handleSearchEmployees,
    handleSearchTickets,
    handleCreateTask,
    resetCreateForm,
    handleStatusChange,
    handleDrop,
    reload: () => setReloadKey((k) => k + 1),
  };
};

export type UseKanban = ReturnType<typeof useKanban>;