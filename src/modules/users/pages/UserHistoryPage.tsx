import {
  ITFlex,
  ITLoader,
  ITPage,
  ITStack,
  ITText,
} from "@axzydev/axzy_ui_system";
import {
  FaUserShield,
  FaClock,
  FaFileSignature,
  FaFileAlt,
  FaUserCheck,
  FaUserPlus,
  FaComment,
  FaBoxOpen,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usersApi, type User } from "@core/api/auth.api";
import { formatFechaHora } from "@core/store/cartas/types";

interface HistoryEntry {
  id: string;
  type: string;
  title: string;
  detail: string;
  timestamp: string;
  refId?: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; bg: string }> = {
  CARTA_CREADA: { icon: <FaFileSignature size={9} />, bg: "bg-emerald-500" },
  CARTA_RESPONSABLE: { icon: <FaUserCheck size={9} />, bg: "bg-blue-500" },
  CARTA_ENCARGADO: { icon: <FaUserPlus size={9} />, bg: "bg-cyan-500" },
  TICKET_CREADO: { icon: <FaFileAlt size={9} />, bg: "bg-amber-500" },
  TICKET_ASIGNADO: { icon: <FaUserCheck size={9} />, bg: "bg-orange-500" },
  TICKET_COMENTARIO: { icon: <FaComment size={9} />, bg: "bg-purple-500" },
  DISPOSITIVO_HISTORIAL: { icon: <FaBoxOpen size={9} />, bg: "bg-slate-400" },
};

export default function UserHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([usersApi.get(id), usersApi.history(id)])
      .then(([u, h]) => {
        setUser(u);
        setHistory(h);
      })
      .catch(() => {
        setUser(null);
        setHistory([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <ITPage
        title="Historial"
        loading
        backAction={() => navigate(-1)}
        icon={<FaUserShield size={20} />}
        breadcrumbs={[
          { label: "Usuarios", onClick: () => navigate("/usuarios") },
          { label: "Historial" },
        ]}
      >
        <ITFlex justify="center">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  if (!user) {
    return (
      <ITPage
        title="Historial"
        backAction={() => navigate(-1)}
        icon={<FaUserShield size={20} />}
        breadcrumbs={[
          { label: "Usuarios", onClick: () => navigate("/usuarios") },
          { label: "Historial" },
        ]}
      >
        <ITText className="text-slate-400">Usuario no encontrado</ITText>
      </ITPage>
    );
  }

  return (
    <ITPage
      title="Historial del usuario"
      description={user.name}
      backAction={() => navigate(-1)}
      icon={<FaUserShield size={20} />}
      breadcrumbs={[
        { label: "Usuarios", onClick: () => navigate("/usuarios") },
        { label: user.name },
      ]}
    >
      <ITFlex className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 mb-6">
        <ITFlex gap={6} wrap>
          <ITStack direction="column" spacing={1}>
            <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Username
            </ITText>
            <ITText className="text-[12px] font-black text-slate-700">
              @{user.username}
            </ITText>
          </ITStack>
          <ITStack direction="column" spacing={1}>
            <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Rol
            </ITText>
            <ITText className="text-[12px] font-bold text-slate-700">
              {user.role === "JEFE_DE_AREA" ? "JEFE DE AREA" : user.role}
            </ITText>
          </ITStack>
          {user.numeroEmpleado && (
            <ITStack direction="column" spacing={1}>
              <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                No. Empleado
              </ITText>
              <ITText className="text-[12px] font-bold text-slate-700">
                {user.numeroEmpleado}
              </ITText>
            </ITStack>
          )}
        </ITFlex>
      </ITFlex>

      <ITFlex className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 md:p-8">
        <ITStack direction="column" spacing={0} className="w-full">
          <ITFlex align="center" gap={2} className="mb-5">
            <FaClock size={14} className="text-slate-400" />
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Actividad ({history.length})
            </ITText>
          </ITFlex>

          {history.length === 0 ? (
            <ITText className="text-[12px] text-slate-400 italic">
              Sin actividad registrada
            </ITText>
          ) : (
            <div className="relative">
              {history.map((entry, idx) => {
                const isLast = idx === history.length - 1;
                const config = TYPE_CONFIG[entry.type] ?? TYPE_CONFIG.DISPOSITIVO_HISTORIAL;

                return (
                  <div key={entry.id} className="flex gap-3 relative">
                    <div className="flex flex-col items-center w-5 shrink-0">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${config.bg} text-white z-10 ring-4 ring-white`}
                      >
                        {config.icon}
                      </div>
                      {!isLast && (
                        <div className="w-px flex-1 bg-gradient-to-b from-slate-200 to-slate-100" />
                      )}
                    </div>

                    <div className={`pb-5 min-w-0 flex-1 ${isLast ? "pb-0" : ""}`}>
                      <div className="rounded-xl p-3 bg-slate-50 border border-slate-100">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-[11px] font-black text-slate-700 leading-tight">
                            {entry.title}
                          </span>
                          <span className="text-[9px] text-slate-400 shrink-0 tabular-nums">
                            {formatFechaHora(entry.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-500 whitespace-pre-wrap">
                          {entry.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ITStack>
      </ITFlex>
    </ITPage>
  );
}
