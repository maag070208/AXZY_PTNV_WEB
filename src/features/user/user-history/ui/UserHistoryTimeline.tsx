import { ITFlex, ITStack, ITText } from "@axzydev/axzy_ui_system";
import {
  FaClock,
  FaFileSignature,
  FaFileAlt,
  FaUserCheck,
  FaUserPlus,
  FaUserSlash,
  FaUserClock,
  FaComment,
  FaBoxOpen,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatFechaHora } from "@shared/utils/dates";
import type { HistoryEntry } from "../model/types";

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; bg: string }> = {
  CARTA_CREADA: { icon: <FaFileSignature size={9} />, bg: "bg-emerald-500" },
  CARTA_RESPONSABLE: { icon: <FaUserCheck size={9} />, bg: "bg-blue-500" },
  CARTA_ENCARGADO: { icon: <FaUserPlus size={9} />, bg: "bg-cyan-500" },
  TICKET_CREADO: { icon: <FaFileAlt size={9} />, bg: "bg-amber-500" },
  TICKET_ASIGNADO: { icon: <FaUserCheck size={9} />, bg: "bg-orange-500" },
  TICKET_COMENTARIO: { icon: <FaComment size={9} />, bg: "bg-purple-500" },
  DISPOSITIVO_HISTORIAL: { icon: <FaBoxOpen size={9} />, bg: "bg-slate-400" },
  USER_DEACTIVATED: { icon: <FaUserSlash size={9} />, bg: "bg-rose-500" },
  USER_REACTIVATED: { icon: <FaUserClock size={9} />, bg: "bg-emerald-500" },
};

interface Props {
  history: HistoryEntry[];
}

export default function UserHistoryTimeline({ history }: Props) {
  const { t: tt } = useTranslation(["users", "common"]);

  return (
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
            {tt("history.empty")}
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
  );
}