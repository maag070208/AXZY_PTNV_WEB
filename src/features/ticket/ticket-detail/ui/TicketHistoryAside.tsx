import { ITBentoFeed } from "@axzydev/axzy_ui_system";
import {
  LuArrowRightLeft,
  LuBuilding2,
  LuCircleCheck,
  LuClock,
  LuMessageSquare,
  LuPhone,
  LuRefreshCw,
  LuTicket,
  LuUserPlus,
  LuCircleX,
} from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { LangostinState } from "@shared/ui/langostin";
import { PanelCard } from "@shared/ui/panel-card";
import { formatDate } from "@shared/i18n";
import type { TimelineEvent } from "../model/timeline";

interface Props {
  events: TimelineEvent[];
}

const EVENT_ICON: Record<string, React.ReactNode> = {
  created: <LuTicket size={13} />,
  closed: <LuCircleX size={13} />,
  follow: <LuRefreshCw size={13} />,
  status: <LuCircleCheck size={13} />,
  priority: <LuArrowRightLeft size={13} />,
  assigned: <LuUserPlus size={13} />,
  department: <LuBuilding2 size={13} />,
  comment: <LuMessageSquare size={13} />,
  captured: <LuPhone size={13} />,
  default: <LuClock size={13} />,
};

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/**
 * Historial del ticket como feed agrupado por día (más reciente arriba). Cada
 * fila dice qué pasó, y quién y a qué hora lo hizo; los comentarios van entre comillas.
 */
export default function TicketHistoryAside({ events }: Props) {
  const { t: tt } = useTranslation("tickets");

  const todayKey = dayKey(new Date().toISOString());
  const yesterdayKey = dayKey(new Date(Date.now() - 86_400_000).toISOString());

  const groups: { key: string; label: string; items: { id: string; icon: React.ReactNode; title: string; meta: string; tone: "success" | "violet" | "neutral" }[] }[] = [];
  for (const event of [...events].reverse()) {
    const key = dayKey(event.timestamp);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      const label =
        key === todayKey ? tt("detail.today") : key === yesterdayKey ? tt("detail.yesterday") : formatDate(event.timestamp);
      group = { key, label, items: [] };
      groups.push(group);
    }
    const isComment = event.type === "comment";
    group.items.push({
      id: event.id,
      icon: EVENT_ICON[event.icon] ?? EVENT_ICON.default,
      title: isComment ? `“${event.detail ?? ""}”` : event.title,
      meta: [timeOf(event.timestamp), event.author].filter(Boolean).join(" · "),
      tone: isComment ? "violet" : event.icon === "closed" || event.icon === "status" ? "success" : "neutral",
    });
  }

  return (
    <PanelCard
      title={tt("detail.historyTitle", { count: events.length })}
      icon={<LuClock size={16} />}
      className="md:sticky md:top-24"
    >
      {events.length === 0 ? (
        <LangostinState kind="empty" size="sm" title={tt("detail.noHistory")} description={tt("detail.noHistoryHint")} />
      ) : (
        <ITBentoFeed groups={groups} maxHeight={520} />
      )}
    </PanelCard>
  );
}
