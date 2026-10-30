import {
  FaTicketAlt,
  FaTimesCircle,
  FaSync,
  FaCheckCircle,
  FaClock,
  FaUserPlus,
  FaBuilding,
  FaComment,
  FaPhoneAlt,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "@shared/utils/dates";
import { PanelCard } from "@shared/ui/panel-card";
import type { TimelineEvent } from "../model/timeline";

interface Props {
  events: TimelineEvent[];
}

const EVENT_ICON: Record<string, React.ReactNode> = {
  created: <FaTicketAlt size={11} />,
  closed: <FaTimesCircle size={11} />,
  follow: <FaSync size={11} />,
  status: <FaCheckCircle size={11} />,
  priority: <FaClock size={11} />,
  assigned: <FaUserPlus size={11} />,
  department: <FaBuilding size={11} />,
  comment: <FaComment size={11} />,
  captured: <FaPhoneAlt size={11} />,
  default: <FaClock size={11} />,
};

/**
 * Historial del ticket: una fila por evento, con la línea de tiempo a la
 * izquierda. Cada fila dice **qué pasó** (título), **quién** lo hizo y **cuándo**,
 * cada dato una sola vez: antes el autor se repetía debajo del título y el
 * comentario mostraba el nombre dos veces.
 */
export default function TicketHistoryAside({ events }: Props) {
  const { t: tt } = useTranslation("tickets");
  return (
    <PanelCard
      title={tt("detail.historyTitle", { count: events.length })}
      icon={<FaClock size={16} />}
      className="md:sticky md:top-24"
    >
      {events.length === 0 ? (
        <p className="text-[12px] italic text-slate-400">{tt("detail.noHistory")}</p>
      ) : (
        <div className="max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
          {[...events].reverse().map((event) => {
            const isComment = event.type === "comment";
            const title = isComment ? tt("detail.commentLabel") : event.title;
            return (
              <div key={event.id} className="flex gap-3">
                <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  {EVENT_ICON[event.icon] ?? EVENT_ICON.default}
                </span>
                <div className="min-w-0 flex-1 border-b border-slate-100 pb-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="min-w-0 flex-1 text-[12.5px] font-semibold leading-snug text-slate-800">{title}</p>
                    <span className="shrink-0 text-[11px] tabular-nums text-slate-400">{formatDateTime(event.timestamp)}</span>
                  </div>
                  {event.detail && (
                    <p className={`mt-0.5 break-words text-[12px] leading-snug ${isComment ? "italic text-slate-600" : "text-slate-600"}`}>
                      {isComment ? `“${event.detail}”` : event.detail}
                    </p>
                  )}
                  {event.author && (
                    <p className="mt-1 text-[11px] text-slate-400">{tt("detail.by", { name: event.author })}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PanelCard>
  );
}
