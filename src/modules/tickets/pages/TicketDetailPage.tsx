import {
  ITBadget,
  ITButton,
  ITFlex,
  ITGrid,
  ITPage,
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
  FaTicketAlt,
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
import { usersApi, type User } from "@core/api/auth.api";
import { departmentsApi, type Department } from "@core/api/departments.api";
import { formatFechaHora } from "@core/store/cartas/types";
import { useAblyTicket } from "@core/hooks/useAbly";
import { downloadTicketPDF } from "../utils/pdf";

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

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const ticket = useSelector((s: RootState) => s.tickets.current);
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const [empleados, setEmpleados] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [commentText, setCommentText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [sendingComment, setSendingComment] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchTicketById(id));
    departmentsApi.list().then(setDepartments).catch(() => setDepartments([]));
    return () => { dispatch(clearCurrent()); };
  }, [id, dispatch]);

  // Ably: live comments
  useAblyTicket(id, (data) => {
    if (data?.comment) {
      dispatch(fetchTicketById(id!));
    }
  });

  useEffect(() => {
    if (ticket?.departmentId) {
      usersApi.empleados(ticket.departmentId).then(setEmpleados).catch(() => setEmpleados([]));
    } else {
      usersApi.empleados().then(setEmpleados).catch(() => setEmpleados([]));
    }
  }, [ticket?.departmentId]);

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

  const handleAssign = async (userId: string) => {
    if (!ticket) return;
    const action = await dispatch(
      updateTicketThunk({ id: ticket.id, data: { asignadoAId: userId || null } })
    );
    if (updateTicketThunk.fulfilled.match(action)) {
      refresh();
      setToastType("success");
      setToast("Responsable actualizado");
    }
  };

  const handleDepartment = async (deptId: string) => {
    if (!ticket) return;
    const updates: Record<string, any> = { departmentId: deptId || null };
    if (deptId && ticket.asignadoAId) {
      const belongsToDept = empleados.some(
        (e) => e.id === ticket.asignadoAId && e.departmentId === deptId
      );
      if (!belongsToDept) {
        updates.asignadoAId = null;
      }
    }
    const action = await dispatch(
      updateTicketThunk({ id: ticket.id, data: updates })
    );
    if (updateTicketThunk.fulfilled.match(action)) {
      refresh();
      setToastType("success");
      setToast("Departamento actualizado");
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
    } catch (e) {
      setToastType("error");
      setToast("Error al generar PDF");
    } finally {
      setDownloadingPDF(false);
    }
  };

  const empleadoOptions = empleados.map((u) => ({
    value: u.id,
    label: u.name + (u.puesto ? ` · ${u.puesto}` : ""),
  }));

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

  const historyTypeIcons: Record<string, { icon: React.ReactNode; bg: string }> = {
    CREATED: { icon: <FaTicketAlt size={9} />, bg: "bg-emerald-500" },
    STATUS: { icon: <FaClock size={9} />, bg: "bg-blue-500" },
    PRIORITY: { icon: <FaClock size={9} />, bg: "bg-amber-500" },
    ASSIGNED: { icon: <FaUserPlus size={9} />, bg: "bg-blue-500" },
    DEPARTMENT: { icon: <FaBuilding size={9} />, bg: "bg-purple-500" },
  };

  const timelineEvents: TimelineEvent[] = [];

  ticket.history.forEach((h) => {
    const meta = historyTypeIcons[h.type] ?? { icon: <FaClock size={9} />, bg: "bg-slate-400" };
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
      icon: <FaComment size={9} />,
      iconBg: "bg-slate-400",
      title: c.autor?.name ?? "Usuario",
      detail: c.texto,
      author: c.autor?.name ?? "Usuario",
      timestamp: c.creadoEn,
    });
  });

  timelineEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

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
        <ITFlex gap={2}>
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
          {!isClosed && (
            <ITButton variant="outlined" size="small" color="success" onClick={() => handleStatusChange("CERRADO")}>
              <ITFlex align="center" gap={1}>
                <FaCheckCircle size={12} />
                <ITText className="font-bold text-[11px]">Finalizar</ITText>
              </ITFlex>
            </ITButton>
          )}
        </ITFlex>
      }
    >
      <div className="flex flex-col md:flex-row gap-5 items-start">
        {/* ── Columna izquierda: contenido principal ── */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-5">
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
              </ITFlex>

              <ITStack direction="column" spacing={2}>
                <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  Descripcion
                </ITText>
                <ITText className="text-[13px] text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                  {ticket.descripcion}
                </ITText>
              </ITStack>

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
            </ITStack>
          </ITFlex>

          {/* Admin panel */}
          {isAdmin && (
            <ITFlex className="bg-white rounded-2xl md:rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-4 sm:p-6 lg:p-8">
              <ITStack direction="column" spacing={4} className="w-full">
                <ITFlex align="center" gap={2}>
                  <FaUserCog size={14} className="text-slate-400" />
                  <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                    Administrar ticket
                  </ITText>
                </ITFlex>

                <ITGrid container columns={12} spacing={3}>
                  <ITGrid item xs={12} sm={6} md={4}>
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
                  <ITGrid item xs={12} sm={6} md={4}>
                    <ITSelect
                      name="departmentId"
                      label="Departamento"
                      placeholder="Seleccionar..."
                      options={departments.map((d) => ({
                        value: d.id,
                        label: d.name,
                      }))}
                      value={ticket.departmentId ?? ""}
                      onChange={(e) => handleDepartment(e.target.value)}
                      disabled={isClosed}
                    />
                  </ITGrid>
                  <ITGrid item xs={12} sm={12} md={4}>
                    <ITSelect
                      name="asignadoAId"
                      label="Asignar a"
                      placeholder="Seleccionar..."
                      options={empleadoOptions}
                      value={ticket.asignadoAId ?? ""}
                      onChange={(e) => handleAssign(e.target.value)}
                      disabled={isClosed}
                    />
                  </ITGrid>
                </ITGrid>
              </ITStack>
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
        <aside className="w-full md:w-80 lg:w-96 shrink-0">
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
                    <div key={event.id} className="flex gap-3">
                      {/* Línea vertical + dot */}
                      <div className="flex flex-col items-center w-6 shrink-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${event.iconBg} text-white z-10 ring-2 ring-white shrink-0`}
                        >
                          {event.icon}
                        </div>
                        {!isLast && (
                          <div className="w-px flex-1 bg-slate-200 min-h-[8px]" />
                        )}
                      </div>

                      {/* Contenido */}
                      <div className={`pb-4 min-w-0 flex-1 ${isLast ? "pb-0" : ""}`}>
                        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                          <span className="text-[11px] font-bold text-slate-700 leading-tight">
                            {event.title}
                          </span>
                          <span className="text-[9px] text-slate-400 tabular-nums whitespace-nowrap">
                            {formatFechaHora(event.timestamp)}
                          </span>
                        </div>
                        {event.detail && (
                          <p className={`text-[11px] leading-snug mt-1 break-words ${
                            isComment ? "text-slate-600 italic" : "text-slate-500"
                          }`}>
                            {isComment ? `"${event.detail}"` : event.detail}
                          </p>
                        )}
                        {event.author && (
                          <span className="text-[9px] text-slate-400 mt-1 block truncate">
                            {event.author}
                          </span>
                        )}
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
    </ITPage>
  );
}