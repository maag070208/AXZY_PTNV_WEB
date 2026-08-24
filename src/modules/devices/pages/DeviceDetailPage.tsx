import {
  ITBadget,
  ITButton,
  ITFlex,
  ITGrid,
  ITLoader,
  ITPage,
  ITStack,
  ITTextarea,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import {
  FaBoxOpen,
  FaBuilding,
  FaCheckCircle,
  FaClock,
  FaComment,
  FaEdit,
  FaExclamationTriangle,
  FaFire,
  FaInfoCircle,
  FaPaperPlane,
  FaTag,
  FaUserCog,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { devicesApi, type Device, type DeviceHistoryEntry } from "@core/api/devices.api";
import { formatFechaHora } from "@core/store/cartas/types";

const ESTADO_BADGE: Record<string, { color: string; label: string }> = {
  DISPONIBLE: { color: "success", label: "Disponible" },
  ASIGNADO: { color: "warning", label: "Asignado" },
  BAJA: { color: "default", label: "Baja" },
};

const HISTORY_ICONS: Record<string, { icon: React.ReactNode; bg: string }> = {
  CREATED: { icon: <FaBoxOpen size={9} />, bg: "bg-emerald-500" },
  ASSIGNED: { icon: <FaUserCog size={9} />, bg: "bg-amber-500" },
  RETURNED: { icon: <FaCheckCircle size={9} />, bg: "bg-blue-500" },
  RETIRED: { icon: <FaExclamationTriangle size={9} />, bg: "bg-red-500" },
  UPDATED: { icon: <FaEdit size={9} />, bg: "bg-purple-500" },
  COMMENT: { icon: <FaComment size={9} />, bg: "bg-slate-400" },
};

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    devicesApi.get(id)
      .then(setDevice)
      .catch(() => setDevice(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleAddComment = async () => {
    if (!device || !commentText.trim()) return;
    setSendingComment(true);
    try {
      const entry = await devicesApi.addHistory(device.id, {
        type: "COMMENT",
        detail: commentText.trim(),
      });
      setDevice((prev) => prev ? { ...prev, history: [...(prev.history ?? []), entry] } : prev);
      setCommentText("");
      setToastType("success");
      setToast("Comentario agregado");
    } catch {
      setToastType("error");
      setToast("Error al agregar comentario");
    } finally {
      setSendingComment(false);
    }
  };

  if (loading) {
    return (
      <ITPage
        title="Dispositivo"
        backAction={() => navigate(-1)}
        icon={<FaBoxOpen size={20} />}
        breadcrumbs={[
          { label: "Dispositivos", onClick: () => navigate("/dispositivos") },
          { label: "Detalle" },
        ]}
        loading
      >
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  if (!device) {
    return (
      <ITPage
        title="Dispositivo"
        backAction={() => navigate(-1)}
        icon={<FaBoxOpen size={20} />}
        breadcrumbs={[
          { label: "Dispositivos", onClick: () => navigate("/dispositivos") },
          { label: "Detalle" },
        ]}
      >
        <ITText className="text-slate-400">Dispositivo no encontrado</ITText>
      </ITPage>
    );
  }

  // Construir timeline
  const history = device.history ?? [];
  const timelineEvents: Array<{
    id: string;
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    detail?: string;
    author?: string;
    timestamp: string;
    isComment: boolean;
  }> = [];

  history.forEach((h) => {
    const config = HISTORY_ICONS[h.type] ?? HISTORY_ICONS.UPDATED;
    const typeLabels: Record<string, string> = {
      CREATED: "Dispositivo registrado",
      ASSIGNED: "Dispositivo asignado",
      RETURNED: "Dispositivo devuelto",
      RETIRED: "Dispositivo retirado",
      UPDATED: "Información actualizada",
      COMMENT: "Comentario",
    };

    timelineEvents.push({
      id: h.id,
      icon: config.icon,
      iconBg: config.bg,
      title: typeLabels[h.type] ?? h.type,
      detail: h.detail ?? undefined,
      author: h.autor?.name,
      timestamp: h.createdAt,
      isComment: h.type === "COMMENT",
    });
  });

  return (
    <ITPage
      title={device.descripcion}
      description={`${device.marca} ${device.modelo} · ${device.controlActivos}`}
      backAction={() => navigate(-1)}
      icon={<FaBoxOpen size={20} />}
      breadcrumbs={[
        { label: "Dispositivos", onClick: () => navigate("/dispositivos") },
        { label: device.controlActivos },
      ]}
      actions={
        <ITButton
          variant="outlined"
          size="small"
          color="secondary"
          onClick={() => navigate(`/dispositivos/${device.id}/editar`)}
        >
          <ITFlex align="center" gap={1}>
            <FaEdit size={12} />
            <ITText className="font-bold text-[11px]">Editar</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <ITFlex justify="center">
        <ITStack direction="column" spacing={5} className="w-full">
          {/* Info del dispositivo */}
          <ITFlex className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 md:p-8">
            <ITStack direction="column" spacing={5} className="w-full">
              <ITFlex gap={2} wrap="wrap">
                <ITBadget color={ESTADO_BADGE[device.estado]?.color as any ?? "default"} size="small">
                  {ESTADO_BADGE[device.estado]?.label ?? device.estado}
                </ITBadget>
                {device.type && (
                  <ITBadget color="primary" size="small">
                    {device.type.name}
                  </ITBadget>
                )}
              </ITFlex>

              <ITGrid container columns={12} spacing={4}>
                <ITGrid item xs={12} md={3}>
                  <ITStack direction="column" spacing={1}>
                    <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Control de activos
                    </ITText>
                    <ITText className="text-[13px] font-black text-slate-800">
                      {device.controlActivos}
                    </ITText>
                  </ITStack>
                </ITGrid>
                <ITGrid item xs={12} md={3}>
                  <ITStack direction="column" spacing={1}>
                    <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Marca / Modelo
                    </ITText>
                    <ITText className="text-[13px] font-bold text-slate-700">
                      {device.marca} {device.modelo}
                    </ITText>
                  </ITStack>
                </ITGrid>
                <ITGrid item xs={12} md={3}>
                  <ITStack direction="column" spacing={1}>
                    <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      No. Serie
                    </ITText>
                    <ITText className="text-[13px] font-bold text-slate-700">
                      {device.numeroSerie ?? "—"}
                    </ITText>
                  </ITStack>
                </ITGrid>
                <ITGrid item xs={12} md={3}>
                  <ITStack direction="column" spacing={1}>
                    <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Área
                    </ITText>
                    <ITText className="text-[13px] font-bold text-slate-700">
                      {device.area}
                    </ITText>
                  </ITStack>
                </ITGrid>
              </ITGrid>

              {device.nombreEquipo && (
                <ITStack direction="column" spacing={1}>
                  <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Nombre del equipo
                  </ITText>
                  <ITText className="text-[12px] font-bold text-slate-700">
                    {device.nombreEquipo}
                  </ITText>
                </ITStack>
              )}

              <ITStack direction="column" spacing={1}>
                <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Registrado
                </ITText>
                <ITText className="text-[11px] text-slate-500">
                  {formatFechaHora(device.createdAt)}
                </ITText>
              </ITStack>
            </ITStack>
          </ITFlex>

          {/* Timeline */}
          <ITFlex className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 md:p-8">
            <ITStack direction="column" spacing={0} className="w-full">
              <ITFlex align="center" gap={2} className="mb-5">
                <FaClock size={14} className="text-slate-400" />
                <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  Historial ({timelineEvents.length})
                </ITText>
              </ITFlex>

              {timelineEvents.length === 0 ? (
                <ITText className="text-[12px] text-slate-400 italic">
                  Sin actividad aún
                </ITText>
              ) : (
                <div className="relative">
                  {timelineEvents.map((event, idx) => {
                    const isLast = idx === timelineEvents.length - 1;

                    return (
                      <div key={event.id} className="flex gap-3 relative">
                        <div className="flex flex-col items-center w-5 shrink-0">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center ${event.iconBg} text-white z-10 ring-4 ring-white`}
                          >
                            {event.icon}
                          </div>
                          {!isLast && (
                            <div className="w-px flex-1 bg-gradient-to-b from-slate-200 to-slate-100" />
                          )}
                        </div>

                        <div className={`pb-5 min-w-0 flex-1 ${isLast ? "pb-0" : ""}`}>
                          <div className="rounded-xl p-3 bg-slate-50 border border-slate-100">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="text-[11px] font-black text-slate-700 leading-tight">
                                {event.title}
                              </span>
                              <span className="text-[9px] text-slate-400 shrink-0 tabular-nums">
                                {formatFechaHora(event.timestamp)}
                              </span>
                            </div>
                            {event.detail && (
                              <p className={`text-[11px] leading-relaxed whitespace-pre-wrap ${
                                event.isComment ? "text-slate-600 mt-1" : "text-slate-500"
                              }`}>
                                {event.isComment ? `"${event.detail}"` : event.detail}
                              </p>
                            )}
                            {event.author && (
                              <span className="text-[9px] text-slate-400 mt-1 inline-block">
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
            </ITStack>
          </ITFlex>

          {/* Comentario */}
          {device.estado !== "BAJA" && (
            <ITFlex className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 md:p-8">
              <ITStack direction="column" spacing={4} className="w-full">
                <ITFlex align="center" gap={2}>
                  <FaComment size={14} className="text-slate-400" />
                  <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                    Agregar comentario
                  </ITText>
                </ITFlex>

                <ITFlex gap={2} align="end">
                  <ITTextarea
                    name="comment"
                    value={commentText}
                    onChange={(v) => setCommentText(v)}
                    placeholder="Escribe un comentario sobre este dispositivo..."
                    rows={3}
                  />
                  <ITButton
                    variant="filled"
                    color="primary"
                    size="small"
                    onClick={handleAddComment}
                    disabled={sendingComment || !commentText.trim()}
                  >
                    <FaPaperPlane size={12} />
                  </ITButton>
                </ITFlex>
              </ITStack>
            </ITFlex>
          )}
        </ITStack>
      </ITFlex>

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
