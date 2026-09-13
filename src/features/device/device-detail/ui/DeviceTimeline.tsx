import { ITFlex, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { FaClock } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n";
import { formatFechaHora } from "@shared/utils/dates";
import type { Device } from "@entities/device";
import { HISTORY_ICONS, TYPE_LABELS } from "../model/constants";

interface Props {
  device: Device;
}

interface TimelineEvent {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  detail?: string;
  author?: string;
  timestamp: string;
  isComment: boolean;
}

export default function DeviceTimeline({ device }: Props) {
  const { t: tt } = useTranslation(["device"]);
  const history = device.history ?? [];

  const events: TimelineEvent[] = history.map((h) => {
    const config = HISTORY_ICONS[h.type] ?? HISTORY_ICONS.UPDATED;
    return {
      id: h.id,
      icon: config.icon,
      iconBg: config.bg,
      title: TYPE_LABELS[h.type] ?? h.type,
      detail: h.detail ?? undefined,
      author: h.autor?.name,
      timestamp: h.createdAt,
      isComment: h.type === "COMMENT",
    };
  });

  return (
    <ITFlex className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 md:p-8">
      <ITStack direction="column" spacing={0} className="w-full">
        <ITFlex align="center" gap={2} className="mb-5">
          <FaClock size={14} className="text-slate-400" />
          <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            {tt("history.title", { count: events.length })}
          </ITText>
        </ITFlex>

        {events.length === 0 ? (
          <ITText className="text-[12px] text-slate-400 italic">
            {tt("history.empty")}
          </ITText>
        ) : (
          <div className="relative">
            {events.map((event, idx) => {
              const isLast = idx === events.length - 1;
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

                  <div
                    className={`pb-5 min-w-0 flex-1 ${isLast ? "pb-0" : ""}`}
                  >
                    <div className="rounded-xl p-3 bg-slate-50 border border-slate-100">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[11px] font-black text-slate-700 leading-tight">
                          {dyn(tt)(event.title)}
                        </span>
                        <span className="text-[9px] text-slate-400 shrink-0 tabular-nums">
                          {formatFechaHora(event.timestamp)}
                        </span>
                      </div>
                      {event.detail && (
                        <p
                          className={`text-[11px] leading-relaxed whitespace-pre-wrap ${
                            event.isComment
                              ? "text-slate-600 mt-1"
                              : "text-slate-500"
                          }`}
                        >
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
  );
}