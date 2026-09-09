import {
  ITButton,
  ITDialog,
  ITFlex,
  ITGrid,
  ITInput,
  ITLoader,
  ITPage,
  ITSearchSelect,
  ITSelect,
  ITStack,
  ITTextarea,
  ITText,
  ITToast,
  ITDatePicker,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBookmark,
  FaCalendarAlt,
  FaCheckCircle,
  FaComments,
  FaExternalLinkAlt,
  FaPlus,
  FaSearch,
  FaSync,
  FaTrello,
  FaUserPlus,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { RootState } from "@core/store/store";
import { usersApi, type User } from "@core/api/auth.api";
import { ticketsApi, type KanbanAssignment, type Ticket } from "@core/api/tickets.api";
import { formatFechaHora } from "@core/store/cartas/types";
import TicketAttachments from "../components/TicketAttachments";

type Status = "PENDIENTE" | "EN_PROGRESO" | "EN_REVISION" | "COMPLETADA";

interface Tone {
  bg: string;
  text: string;
}

const COLUMNS: Array<{ status: Status; label: string }> = [
  { status: "PENDIENTE", label: "Pendiente" },
  { status: "EN_PROGRESO", label: "En progreso" },
  { status: "EN_REVISION", label: "En revisión" },
  { status: "COMPLETADA", label: "Completada" },
];

const FALLBACK_TONE: Tone = { bg: "bg-slate-400", text: "text-white" };

const PRIORITY_META: Record<string, { label: string; tone: Tone }> = {
  BAJA: { label: "Baja", tone: { bg: "bg-slate-400", text: "text-white" } },
  MEDIA: { label: "Media", tone: { bg: "bg-amber-500", text: "text-white" } },
  ALTA: { label: "Alta", tone: { bg: "bg-orange-600", text: "text-white" } },
  URGENTE: { label: "Urgente", tone: { bg: "bg-rose-600", text: "text-white" } },
};

const STATUS_META: Record<string, { label: string; tone: Tone }> = {
  ABIERTO: { label: "Abierto", tone: { bg: "bg-amber-500", text: "text-white" } },
  EN_SEGUIMIENTO: { label: "En seguimiento", tone: { bg: "bg-blue-500", text: "text-white" } },
  CERRADO: { label: "Cerrado", tone: { bg: "bg-emerald-600", text: "text-white" } },
};

const ASSIGNMENT_STATUS_META: Record<Status, { label: string; tone: Tone }> = {
  PENDIENTE: { label: "Pendiente", tone: { bg: "bg-slate-400", text: "text-white" } },
  EN_PROGRESO: { label: "En progreso", tone: { bg: "bg-blue-500", text: "text-white" } },
  EN_REVISION: { label: "En revisión", tone: { bg: "bg-purple-500", text: "text-white" } },
  COMPLETADA: { label: "Completada", tone: { bg: "bg-emerald-600", text: "text-white" } },
};

// Paleta determinista para etiquetas de departamento y avatares: mismo
// nombre siempre obtiene el mismo color, sin tener que mantener un mapa
// manual por departamento.
const TAG_PALETTE: Tone[] = [
  { bg: "bg-blue-500", text: "text-white" },
  { bg: "bg-purple-500", text: "text-white" },
  { bg: "bg-emerald-600", text: "text-white" },
  { bg: "bg-amber-500", text: "text-white" },
  { bg: "bg-rose-500", text: "text-white" },
  { bg: "bg-cyan-600", text: "text-white" },
  { bg: "bg-indigo-500", text: "text-white" },
  { bg: "bg-teal-600", text: "text-white" },
  { bg: "bg-fuchsia-500", text: "text-white" },
  { bg: "bg-orange-500", text: "text-white" },
  { bg: "bg-lime-600", text: "text-white" },
  { bg: "bg-sky-600", text: "text-white" },
  { bg: "bg-pink-500", text: "text-white" },
  { bg: "bg-violet-500", text: "text-white" },
];

function hashTone(key: string): Tone {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return TAG_PALETTE[hash % TAG_PALETTE.length];
}

function metaFor(map: Record<string, { label: string; tone: Tone }>, key: string) {
  return map[key] ?? { label: key, tone: FALLBACK_TONE };
}

function Tag({ label, tone, icon }: { label: string; tone: Tone; icon?: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide whitespace-nowrap ${tone.bg} ${tone.text}`}
    >
      {icon}
      {label}
    </span>
  );
}

// Clases completas y estáticas por tamaño: Tailwind solo genera utilidades
// que aparecen literalmente en el código, así que un `w-${size}` armado en
// tiempo de ejecución nunca compila a nada (por eso los avatares se veían
// vacíos). Este mapa evita ese problema por completo.
const AVATAR_SIZE_CLASSES: Record<number, string> = {
  6: "w-6 h-6 text-[8px]",
  7: "w-7 h-7 text-[9px]",
  8: "w-8 h-8 text-[10px]",
};

function Avatar({ name, seed, size = 7 }: { name: string; seed: string; size?: 6 | 7 | 8 }) {
  const tone = hashTone(`avatar:${seed}`);
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const sizeClass = AVATAR_SIZE_CLASSES[size] ?? AVATAR_SIZE_CLASSES[7];
  return (
    <div
      title={name}
      className={`${sizeClass} leading-none rounded-full ${tone.bg} ${tone.text} border-2 border-white shadow-sm flex items-center justify-center shrink-0 font-black`}
    >
      {initials}
    </div>
  );
}

export default function KanbanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ticketId = searchParams.get("ticketId") ?? undefined;
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = currentUser?.role === "ADMIN";
  const isEmpleado = currentUser?.role === "EMPLEADO";
  const isJefeArea = currentUser?.role === "JEFE_DE_AREA";
  const canCreate = isAdmin || isJefeArea;
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
      .catch((e: any) => setError(e.message ?? "No se pudo cargar el tablero"))
      .finally(() => setLoading(false));
  }, [ticketId]);

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
    ticketsApi.list().then((res) => setTicketOptions(res.data)).catch(() => setTicketOptions([]));
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
    rows.forEach((r) => set.add(r.ticket.department?.name ?? "General"));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (assigneeFilter && r.userId !== assigneeFilter) return false;
      const deptName = r.ticket.department?.name ?? "General";
      if (departmentFilter && deptName !== departmentFilter) return false;
      if (q && !r.title.toLowerCase().includes(q) && !r.ticket.titulo.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [rows, assigneeFilter, departmentFilter, search]);

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

  const hasActiveFilters = Boolean(assigneeFilter || departmentFilter || search.trim());

  const clearFilters = () => {
    setAssigneeFilter(null);
    setDepartmentFilter("");
    setSearch("");
  };

  const openTicket = async (ticketId: string) => {
    setModalLoading(true);
    setModalTicket(null);
    try {
      const t = await ticketsApi.get(ticketId);
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
      setToast("Tarea asignada");
    } catch (e: any) {
      setError(e.message ?? "No se pudo asignar la tarea");
    } finally {
      setCreatingTask(false);
    }
  };

  const employeeOptions = employees.map((employee) => ({
    value: employee.id,
    label: [employee.name, employee.numeroEmpleado ? `#${employee.numeroEmpleado}` : null]
      .filter(Boolean)
      .join(" "),
  }));

  const ticketSelectOptions = ticketOptions.map((t) => ({
    value: t.id,
    label: `${t.titulo} · #${t.id.slice(0, 8).toUpperCase()}`,
  }));

  const canManageModalTicket = Boolean(
    modalTicket &&
      (isAdmin || (isJefeArea && modalTicket.creadoPorId === currentUser?.id))
  );

  const handleStatusChange = async (assignment: KanbanAssignment, status: Status) => {
    try {
      await ticketsApi.updateAssignment(assignment.ticketId, assignment.id, { status });
      setRows((prev) =>
        prev.map((r) => (r.id === assignment.id ? { ...r, status } : r))
      );
      if (modalTicket) {
        const t = await ticketsApi.get(assignment.ticketId);
        setModalTicket(t);
      }
      setToast("Tarea movida");
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
    if (status === "COMPLETADA" && !isAdmin) {
      setToast("Solo el administrador puede cerrar una tarea");
      setDraggingId(null);
      return;
    }
    handleStatusChange(assignment, status);
    setDraggingId(null);
  };

  return (
    <ITPage
      title={ticketId ? "Tareas del ticket" : "Tablero de tareas"}
      description={ticketId ? "Tareas asignadas a este ticket" : "Seguimiento kanban de las tareas asignadas a los tickets"}
      backAction={() => navigate(-1)}
      icon={<FaTrello size={20} />}
      breadcrumbs={[
        { label: "Tickets", onClick: () => navigate("/tickets") },
        ...(ticketId
          ? [{ label: "Ticket", onClick: () => navigate(`/tickets/${ticketId}`) }, { label: "Tablero" }]
          : [{ label: "Tablero" }]),
      ]}
      actions={
        ticketId ? (
          canCreate ? (
            <ITButton variant="filled" color="primary" onClick={() => navigate(`/tickets/${ticketId}`)}>
              <ITFlex align="center" gap={1}>
                <FaPlus size={12} />
                <ITText className="font-bold text-[11px]">Nueva tarea</ITText>
              </ITFlex>
            </ITButton>
          ) : undefined
        ) : !isEmpleado ? (
          <ITFlex align="center" gap={2}>
            <ITButton variant="outlined" color="primary" onClick={() => setShowCreatePanel(true)}>
              <ITFlex align="center" gap={1}>
                <FaUserPlus size={12} />
                <ITText className="font-bold text-[11px]">Nueva tarea</ITText>
              </ITFlex>
            </ITButton>
            <ITButton variant="filled" color="primary" onClick={() => navigate("/tickets/nuevo")}>
              <ITFlex align="center" gap={1}>
                <FaPlus size={12} />
                <ITText className="font-bold text-[11px]">Nuevo ticket</ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        ) : undefined
      }
    >
      {/* Barra de herramientas: búsqueda, filtro de departamento, avatares y refrescar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <ITFlex align="center" gap={3} className="flex-wrap">
          <div className="w-60">
            <ITInput
              name="kanbanSearch"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tarea o ticket..."
              iconLeft={<FaSearch size={11} className="text-slate-400" />}
            />
          </div>
          <div className="w-48">
            <ITSelect
              name="kanbanDepartmentFilter"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              options={[
                { value: "", label: "Todos los departamentos" },
                ...departmentOptions.map((d) => ({ value: d, label: d })),
              ]}
            />
          </div>
          {uniqueAssignees.length > 0 && (
            <div className="flex items-center -space-x-2">
              {uniqueAssignees.slice(0, 4).map((u) => {
                const active = assigneeFilter === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setAssigneeFilter((cur) => (cur === u.id ? null : u.id))}
                    className={`rounded-full transition-all hover:z-10 hover:-translate-y-0.5 ${
                      active ? "ring-2 ring-offset-2 ring-blue-400 rounded-full" : ""
                    }`}
                  >
                    <Avatar name={u.name} seed={u.id} />
                  </button>
                );
              })}
              {uniqueAssignees.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[9px] font-black border-2 border-white shadow-sm">
                  +{uniqueAssignees.length - 4}
                </div>
              )}
            </div>
          )}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline underline-offset-2"
            >
              Limpiar filtros
            </button>
          )}
        </ITFlex>
        <ITFlex align="center" gap={2}>
          {loading && (
            <ITText className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Cargando…
            </ITText>
          )}
          {error && <ITText className="text-[11px] font-bold text-red-600">{error}</ITText>}
          <ITButton variant="outlined" onClick={() => setReloadKey((k) => k + 1)}>
            <ITFlex align="center" gap={1}>
              <FaSync size={11} />
              <ITText className="font-bold text-[11px]">Actualizar</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      </div>

      {/* Tablero: columnas planas estilo Jira, scroll horizontal en pantallas angostas */}
      <div className="flex items-start gap-4 overflow-x-auto pb-2 -mx-2 px-2">
        {COLUMNS.map((col) => (
          <div
            key={col.status}
            className={`flex-none w-[300px] sm:w-[320px] rounded-2xl bg-slate-100/70 border border-slate-200 p-3 transition-colors ${
              dragOver === col.status ? "bg-blue-50 border-blue-300" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(col.status);
            }}
            onDragLeave={() => setDragOver((s) => (s === col.status ? null : s))}
            onDrop={handleDrop(col.status)}
          >
            <ITFlex justify="between" align="center" className="mb-3 px-1">
              <ITFlex align="center" gap={1.5}>
                {col.status === "COMPLETADA" && <FaCheckCircle size={12} className="text-emerald-500" />}
                <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  {col.label}
                </ITText>
              </ITFlex>
              <div className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                <span className="text-[9px] font-black text-slate-500">{byStatus[col.status].length}</span>
              </div>
            </ITFlex>

            <div className="space-y-2 min-h-[140px]">
              {byStatus[col.status].length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
                  <ITText className="text-[10px] text-slate-400 italic">Sin tareas</ITText>
                </div>
              ) : (
                byStatus[col.status].map((a) => {
                  const deptLabel = a.ticket.department?.name ?? "General";
                  const deptTone = hashTone(deptLabel);
                  const priorityMeta = metaFor(PRIORITY_META, a.ticket.priority);
                  const overdue = Boolean(a.dueDate && a.status !== "COMPLETADA" && new Date(a.dueDate) < new Date());
                  return (
                    <div
                      key={a.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", a.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDraggingId(a.id);
                      }}
                      onDragEnd={() => setDraggingId(null)}
                      onClick={() => openTicket(a.ticketId)}
                      className={`rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-3 cursor-pointer ${
                        draggingId === a.id ? "opacity-40" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Tag label={deptLabel} tone={deptTone} />
                        {overdue && <Tag label="Vencida" tone={{ bg: "bg-rose-600", text: "text-white" }} />}
                      </div>

                      <ITText className="text-[12.5px] font-bold text-slate-800 leading-snug line-clamp-2 mb-1">
                        {a.title}
                      </ITText>
                      <ITText className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide truncate mb-2">
                        {a.ticket.titulo}
                      </ITText>

                      {a.description ? (
                        <div className="text-[11px] text-slate-500 leading-snug mb-2 line-clamp-2">
                          {a.description}
                        </div>
                      ) : null}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <ITFlex align="center" gap={1.5} className="min-w-0">
                          <FaBookmark size={10} className="text-emerald-500 shrink-0" />
                          <span className="text-[9px] font-bold text-slate-400 truncate">
                            #{a.ticketId.slice(0, 8).toUpperCase()}
                          </span>
                        </ITFlex>
                        <ITFlex align="center" gap={2} className="shrink-0">
                          <span
                            title={priorityMeta.label}
                            className={`w-2 h-2 rounded-full ${priorityMeta.tone.bg}`}
                          />
                          <Avatar name={a.user.name} seed={a.userId} />
                        </ITFlex>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal: detalle del ticket (solo lectura, sin alta de tareas) */}
      <ITDialog
        isOpen={modalLoading || !!modalTicket}
        className="w-full max-w-4xl"
        onClose={() => setModalTicket(null)}
      >
        {modalLoading || !modalTicket ? (
          <ITFlex justify="center" align="center" className="py-10">
            <ITLoader variant="spinner" size="md" color="primary" />
          </ITFlex>
        ) : (
          <div>
            <div className="pb-3 border-b border-slate-100 pr-8 mb-4">
              <ITFlex align="center" gap={2} className="mb-1.5">
                <FaBookmark size={12} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  #{modalTicket.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-[10px] text-slate-400">Creado {formatFechaHora(modalTicket.creadoEn)}</span>
              </ITFlex>
              <ITText className="text-xl font-black text-slate-800 leading-tight">{modalTicket.titulo}</ITText>
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
                    {modalTicket.descripcion || "Sin descripción"}
                  </div>
                </div>

                <TicketAttachments
                  ticketId={modalTicket.id}
                  canUpload={canManageModalTicket || Boolean(modalTicket.creadoPorId === currentUser?.id)}
                />

                <div>
                  <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Tareas asignadas ({modalTicket.assignments.length})
                  </ITText>
                  <div className="max-h-[42vh] overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {modalTicket.assignments.map((t) => (
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

                          <div className="text-[12.5px] font-bold text-slate-800 mb-1">{t.title}</div>
                          {t.description ? (
                            <div className="text-[11.5px] text-slate-500 leading-relaxed mb-2">{t.description}</div>
                          ) : null}

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
                              ticketId={modalTicket.id}
                              assignmentId={t.id}
                              compact
                              canUpload={
                                canManageModalTicket || t.userId === currentUser?.id
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {modalTicket.assignments.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center">
                        <ITText className="text-[11px] text-slate-400">Este ticket aún no tiene tareas asignadas.</ITText>
                      </div>
                    )}
                  </div>
                </div>
              </ITStack>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4 h-fit">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Estado</div>
                  <Tag {...metaFor(STATUS_META, modalTicket.status)} />
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Prioridad</div>
                  <Tag {...metaFor(PRIORITY_META, modalTicket.priority)} />
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Departamento</div>
                  <Tag label={modalTicket.department?.name ?? "General"} tone={hashTone(modalTicket.department?.name ?? "General")} />
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Creado por</div>
                  <div className="text-[11px] font-bold text-slate-700">{modalTicket.creadoPor?.name}</div>
                </div>
                <ITButton
                  variant="filled"
                  color="primary"
                  className="w-full justify-center"
                  onClick={() => navigate(`/tickets/${modalTicket.id}`)}
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

      {/* Modal: alta rápida de tarea desde el tablero principal */}
      <ITDialog
        isOpen={showCreatePanel}
        className="w-full max-w-lg"
        onClose={() => {
          setShowCreatePanel(false);
          resetCreateForm();
        }}
      >
        <div className="pb-3 mb-3 border-b border-slate-100 pr-6">
          <ITFlex align="center" gap={2}>
            <FaUserPlus size={14} className="text-emerald-500" />
            <ITText className="text-lg font-black text-slate-800">Nueva tarea</ITText>
          </ITFlex>
          <ITText className="text-[11px] text-slate-400 mt-1">Asigna una tarea a un ticket existente</ITText>
        </div>
        <ITGrid container columns={12} spacing={2}>
          <ITGrid item xs={12}>
            <ITSearchSelect
              name="createTicket"
              label="Ticket *"
              placeholder="Buscar ticket..."
              options={ticketSelectOptions}
              value={createTicketId}
              onChange={(value) => setCreateTicketId(String(value))}
              onSearch={handleSearchTickets}
              isLoading={busyTickets}
            />
          </ITGrid>
          <ITGrid item xs={12}>
            <ITSearchSelect
              name="createEmployee"
              label="Empleado *"
              placeholder="Buscar empleado..."
              options={employeeOptions}
              value={createUserId}
              onChange={(value) => setCreateUserId(String(value))}
              onSearch={handleSearchEmployees}
              isLoading={busyEmployees}
            />
          </ITGrid>
          <ITGrid item xs={12}>
            <ITInput name="createTaskTitle" label="Título de la tarea *" value={createTitle} onChange={(event) => setCreateTitle(event.target.value)} placeholder="Ej. Revisar instalación" />
          </ITGrid>
          <ITGrid item xs={12}>
            <ITTextarea name="createTaskDescription" label="Descripción" value={createDescription} onChange={setCreateDescription} rows={2} placeholder="Detalles de la tarea..." />
          </ITGrid>
          <ITGrid item xs={12} sm={6}>
            <ITDatePicker name="createStart" label="Inicio" value={createStart ? new Date(createStart) : undefined} onChange={(event: any) => setCreateStart(event.target.value ? event.target.value.toISOString() : "")} />
          </ITGrid>
          <ITGrid item xs={12} sm={6}>
            <ITDatePicker name="createDue" label="Fecha límite" value={createDue ? new Date(createDue) : undefined} onChange={(event: any) => setCreateDue(event.target.value ? event.target.value.toISOString() : "")} />
          </ITGrid>
          <ITGrid item xs={12}>
            <ITFlex justify="end" gap={2}>
              <ITButton
                variant="outlined"
                size="small"
                onClick={() => {
                  setShowCreatePanel(false);
                  resetCreateForm();
                }}
              >
                Cancelar
              </ITButton>
              <ITButton
                variant="filled"
                color="primary"
                size="small"
                onClick={handleCreateTask}
                disabled={creatingTask || !createTicketId || !createUserId || !createTitle.trim()}
              >
                <ITFlex align="center" gap={1}>
                  <FaUserPlus size={11} />
                  <ITText className="font-bold text-[10px]">{creatingTask ? "Asignando..." : "Asignar tarea"}</ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          </ITGrid>
        </ITGrid>
      </ITDialog>

      {toast && (
        <ITToast
          message={toast}
          type="success"
          position="bottom-center"
          duration={2000}
          onClose={() => setToast(null)}
        />
      )}
    </ITPage>
  );
}
