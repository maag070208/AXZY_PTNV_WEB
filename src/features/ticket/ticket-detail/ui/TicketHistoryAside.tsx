import {
  FaTicketAlt,
  FaTimesCircle,
  FaSync,
  FaCheckCircle,
  FaClock,
  FaUserPlus,
  FaBuilding,
  FaComment,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatFechaHora } from "@shared/utils/dates";
import type { TimelineEvent } from "../model/timeline";

interface Props {
  events: TimelineEvent[];
}

const EVENT_ICON: Record<string, React.ReactNode> = {
  created: <FaTicketAlt size={10} />,
  closed: <FaTimesCircle size={10} />,
  follow: <FaSync size={10} />,
  status: <FaCheckCircle size={10} />,
  priority: <FaClock size={10} />,
  assigned: <FaUserPlus size={10} />,
  department: <FaBuilding size={10} />,
  comment: <FaComment size={10} />,
  default: <FaClock size={10} />,
};

export default function TicketHistoryAside({ events }: Props) {
  const { t: tt } = useTranslation("tickets");
  return (
    <div className="bg-white rounded-2xl md:rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-4 sm:p-6 md:sticky md:top-24">
      <div className="flex items-center gap-2 mb-5">
        <FaClock size={14} className="text-slate-400" />
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
          {tt("detail.historyTitle", { count: events.length })}
        </p>
      </div>

      {events.length === 0 ? (
        <p className="text-[12px] text-slate-400 italic">{tt("detail.noHistory")}</p>
      ) : (
        <div className="space-y-0 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
          {[...events].reverse().map((event, idx) => {
            const isComment = event.type === "comment";
            const isLast = idx === 0;

            return (
              <div key={event.id} className="flex gap-3 relative">
                {!isLast && (
                  <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 to-slate-100" />
                )}

                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${event.iconBg} text-white z-10 ring-2 ring-white shrink-0 shadow-sm`}
                >
                  {EVENT_ICON[event.icon] ?? EVENT_ICON.default}
                </div>

                <div className={`pb-5 min-w-0 flex-1 ${isLast ? "pb-0" : ""}`}>
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 mb-1">
                      <span
                        className={`text-[11px] font-bold leading-tight ${
                          event.title.includes("CERRADO") ? "text-red-600" : "text-slate-700"
                        }`}
                      >
                        {event.title}
                      </span>
                      <span className="text-[9px] text-slate-400 tabular-nums whitespace-nowrap bg-white px-1.5 py-0.5 rounded">
                        {formatFechaHora(event.timestamp)}
                      </span>
                    </div>
                    {event.detail && (
                      <p className={`text-[11px] leading-snug break-words ${isComment ? "text-slate-600 italic" : "text-slate-500"}`}>
                        {isComment ? `"${event.detail}"` : event.detail}
                      </p>
                    )}
                    {event.author && (
                      <span className="text-[9px] text-slate-400 mt-1 block">
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
    </div>
  );
}