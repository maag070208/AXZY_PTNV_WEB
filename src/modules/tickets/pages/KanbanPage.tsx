import {
  ITBadget,
  ITButton,
  ITDialog,
  ITFlex,
  ITLoader,
  ITPage,
  ITStack,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaExternalLinkAlt, FaPlus, FaSync, FaTrello } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "@core/store/store";
import { ticketsApi, type KanbanAssignment, type Ticket } from "@core/api/tickets.api";
import { formatFechaHora } from "@core/store/cartas/types";

type Status = "PENDIENTE" | "EN_PROGRESO" | "EN_REVISION" | "COMPLETADA";

const COLUMNS: Array<{ status: Status; label: string; accent: string; dot: string }> = [
  { status: "PENDIENTE", label: "Pendiente", accent: "border-t-slate-400", dot: "bg-slate-400" },
  { status: "EN_PROGRESO", label: "En progreso", accent: "border-t-blue-500", dot: "bg-blue-500" },
  { status: "EN_REVISION", label: "En revisión", accent: "border-t-purple-500", dot: "bg-purple-500" },
  { status: "COMPLETADA", label: "Completada", accent: "border-t-emerald-500", dot: "bg-emerald-500" },
];

const PRIORITY_BADGE: Record<string, { color: string; label: string }> = {
  BAJA: { color: "gray", label: "Baja" },
  MEDIA: { color: "warning", label: "Media" },
  ALTA: { color: "danger", label: "Alta" },
  URGENTE: { color: "danger", label: "Urgente" },
};

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  ABIERTO: { color: "warning", label: "Abierto" },
  EN_SEGUIMIENTO: { color: "info", label: "En seguimiento" },
  CERRADO: { color: "success", label: "Cerrado" },
};

export default function KanbanPage() {
  const navigate = useNavigate();
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = currentUser?.role === "ADMIN";
  const isEmpleado = currentUser?.role === "EMPLEADO";
  const [rows, setRows] = useState<KanbanAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [modalTicket, setModalTicket] = useState<Ticket | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Status | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    ticketsApi
      .kanban()
      .then((res) => setRows(res.data.filter((a) => !a.ticket.deletedAt)))
      .catch((e: any) => setError(e.message ?? "No se pudo cargar el tablero"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const byStatus = useMemo(
    () =>
      COLUMNS.reduce(
        (acc, c) => {
          acc[c.status] = rows.filter((r) => r.status === c.status);
          return acc;
        },
        {} as Record<Status, KanbanAssignment[]>
      ),
    [rows]
  );

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

  const initials = (name: string) =>
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

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
      title="Tablero de tareas"
      description="Seguimiento kanban de las tareas asignadas a los tickets"
      backAction={() => navigate(-1)}
      icon={<FaTrello size={20} />}
      breadcrumbs={[
        { label: "Tickets", onClick: () => navigate("/tickets") },
        { label: "Tablero" },
      ]}
      actions={
        !isEmpleado ? (
          <ITButton variant="filled" color="primary" onClick={() => navigate("/tickets/nuevo")}>
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">Nuevo ticket</ITText>
            </ITFlex>
          </ITButton>
        ) : undefined
      }
    >
      <ITFlex justify="end" align="center" gap={2} className="mb-4">
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

      {/* Trello: 3 columnas fijas lado a lado, scroll horizontal en pantallas angostas */}
      <div className="flex items-start gap-4 overflow-x-auto pb-2 -mx-2 px-2">
        {COLUMNS.map((col) => (
          <div
            key={col.status}
            className={`flex-none w-[300px] sm:w-[320px] rounded-2xl border-t-4 ${col.accent} bg-slate-50/80 border border-slate-200 p-3 transition-colors ${
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
              <ITFlex align="center" gap={2}>
                <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-600">
                  {col.label}
                </ITText>
              </ITFlex>
              <ITBadget color="primary" size="small">
                {byStatus[col.status].length}
              </ITBadget>
            </ITFlex>

            <div className="space-y-2 min-h-[140px]">
              {byStatus[col.status].length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
                  <ITText className="text-[10px] text-slate-400 italic">Sin tareas</ITText>
                </div>
              ) : (
                byStatus[col.status].map((a) => (
                  <div
                    key={a.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", a.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDraggingId(a.id);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    className={`rounded-xl bg-white border border-slate-200 shadow-sm p-3 cursor-pointer hover:border-blue-300 hover:shadow transition-all ${
                      draggingId === a.id ? "opacity-40" : ""
                    }`}
                    onClick={() => openTicket(a.ticketId)}
                  >
                    <ITFlex justify="between" align="center" gap={2} className="mb-1.5">
                      <ITText className="text-[11px] font-black text-slate-700 leading-tight truncate">
                        {a.title}
                      </ITText>
                      <ITBadget
                        color={PRIORITY_BADGE[a.ticket.priority]?.color as any ?? "gray"}
                        size="small"
                      >
                        {PRIORITY_BADGE[a.ticket.priority]?.label ?? a.ticket.priority}
                      </ITBadget>
                    </ITFlex>

                    {a.description ? (
                      <div className="text-[11px] text-slate-600 leading-snug mb-2 line-clamp-2">
                        {a.description}
                      </div>
                    ) : null}

                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 truncate">
                      {a.ticket.titulo}
                    </div>

                    {a.dueDate && a.status !== "COMPLETADA" && new Date(a.dueDate) < new Date() && (
                      <div className="mb-2">
                        <ITBadget color="danger" size="small">Vencida</ITBadget>
                      </div>
                    )}

                    <ITFlex justify="between" align="center" gap={2}>
                      <ITFlex align="center" gap={1.5} className="min-w-0">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          <ITText className="text-[9px] font-black text-slate-600">
                            {initials(a.user.name)}
                          </ITText>
                        </div>
                        <ITText className="text-[10px] font-bold text-slate-500 truncate">
                          {a.user.name}
                        </ITText>
                      </ITFlex>
                    </ITFlex>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal tipo Trello: detalle del ticket */}
      <ITDialog
        isOpen={modalLoading || !!modalTicket}
        onClose={() => {
          setModalTicket(null);
        }}
        title={modalTicket?.titulo ?? "Ticket"}
      >
        {modalLoading || !modalTicket ? (
          <ITFlex justify="center" align="center" className="py-10">
            <ITLoader variant="spinner" size="md" color="primary" />
          </ITFlex>
        ) : (
          <ITStack direction="column" spacing={4} className="w-full">
            <ITFlex gap={2} wrap="wrap">
              <ITBadget color={STATUS_BADGE[modalTicket.status]?.color as any ?? "gray"} size="small">
                {STATUS_BADGE[modalTicket.status]?.label ?? modalTicket.status}
              </ITBadget>
              <ITBadget color={PRIORITY_BADGE[modalTicket.priority]?.color as any ?? "gray"} size="small">
                {PRIORITY_BADGE[modalTicket.priority]?.label ?? modalTicket.priority}
              </ITBadget>
              {modalTicket.department && (
                <ITBadget color="primary" size="small">
                  {modalTicket.department.name}
                </ITBadget>
              )}
              <ITBadget color="secondary" size="small">
                {formatFechaHora(modalTicket.creadoEn)}
              </ITBadget>
            </ITFlex>

            <div className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">
              {modalTicket.descripcion}
            </div>

            <div>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Tareas ({modalTicket.assignments.length})
              </ITText>
              <div className="space-y-2">
                {modalTicket.assignments.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5"
                  >
                    <ITFlex justify="between" align="center" gap={2} className="mb-1">
                      <ITText className="text-[11px] font-black text-slate-700">
                        {t.user.name}
                        {t.user.numeroEmpleado ? ` · #${t.user.numeroEmpleado}` : ""}
                      </ITText>
                      <ITBadget
                        color={
                          t.status === "COMPLETADA"
                            ? "success"
                            : t.status === "EN_PROGRESO"
                            ? "info"
                            : t.status === "EN_REVISION"
                            ? "purple"
                            : "gray"
                        }
                        size="small"
                      >
                        {t.status === "COMPLETADA"
                          ? "Completada"
                          : t.status === "EN_PROGRESO"
                          ? "En progreso"
                          : t.status === "EN_REVISION"
                          ? "En revisión"
                          : "Pendiente"}
                      </ITBadget>
                    </ITFlex>
                    <div className="text-[11px] font-black text-slate-800">{t.title}</div>
                    {t.description ? (
                      <div className="text-[11px] text-slate-600 mt-0.5">{t.description}</div>
                    ) : null}
                    {(t.startDate || t.dueDate) && (
                      <div className="text-[9px] text-slate-400 mt-1">
                        {t.startDate
                          ? `Inicio: ${new Date(t.startDate).toLocaleDateString("es-MX")}`
                          : ""}
                        {t.startDate && t.dueDate ? " · " : ""}
                        {t.dueDate
                          ? `Fin esperada: ${new Date(t.dueDate).toLocaleDateString("es-MX")}`
                          : ""}
                      </div>
                    )}
                    {t.comments && t.comments.length > 0 && (
                      <div className="mt-1.5 text-[9px] text-slate-400">
                        {t.comments.length} comentario(s)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <ITFlex justify="end" gap={2}>
              <ITButton
                variant="filled"
                color="primary"
                onClick={() => navigate(`/tickets/${modalTicket.id}`)}
              >
                <ITFlex align="center" gap={1}>
                  <FaExternalLinkAlt size={11} />
                  <ITText className="font-bold text-[11px]">Abrir detalle completo</ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          </ITStack>
        )}
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