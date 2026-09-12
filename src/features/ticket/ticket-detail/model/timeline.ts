import type { Ticket } from "@entities/ticket";

export interface TimelineEvent {
  id: string;
  type: "created" | "status_change" | "assigned" | "department" | "comment" | string;
  icon: string;
  iconBg: string;
  title: string;
  detail?: string;
  author?: string;
  timestamp: string;
}

export const todayInput = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const getHistoryMeta = (h: Ticket["history"][0]) => {
  if (h.type === "CREATED")
    return {
      icon: "created",
      bg: "bg-emerald-500",
      color: "text-emerald-600",
    };
  if (h.type === "STATUS") {
    if (h.detail?.includes("CERRADO"))
      return { icon: "closed", bg: "bg-red-500", color: "text-red-600" };
    if (h.detail?.includes("EN_SEGUIMIENTO"))
      return { icon: "follow", bg: "bg-blue-500", color: "text-blue-600" };
    return { icon: "status", bg: "bg-sky-500", color: "text-sky-600" };
  }
  if (h.type === "PRIORITY")
    return { icon: "priority", bg: "bg-amber-500", color: "text-amber-600" };
  if (h.type === "ASSIGNED")
    return { icon: "assigned", bg: "bg-violet-500", color: "text-violet-600" };
  if (h.type === "DEPARTMENT")
    return { icon: "department", bg: "bg-purple-500", color: "text-purple-600" };
  return { icon: "default", bg: "bg-slate-400", color: "text-slate-500" };
};

export const buildTimeline = (ticket: Ticket): TimelineEvent[] => {
  const events: TimelineEvent[] = [
    ...ticket.history.map((h) => {
      const meta = getHistoryMeta(h);
      return {
        id: h.id,
        type: h.type.toLowerCase(),
        icon: meta.icon,
        iconBg: meta.bg,
        title: h.detail ?? h.type,
        author: h.autor?.name ?? "Sistema",
        timestamp: h.createdAt,
      };
    }),
    ...ticket.comments.map((c) => ({
      id: c.id,
      type: "comment",
      icon: "comment",
      iconBg: "bg-slate-400",
      title: c.autor?.name ?? "Usuario",
      detail: c.texto,
      author: c.autor?.name ?? "Usuario",
      timestamp: c.creadoEn,
    })),
  ];
  return events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};

export const calculateEfficacy = (ticket: Ticket) => {
  if (!ticket.closedAt) return null;
  const created = new Date(ticket.creadoEn).getTime();
  const closed = new Date(ticket.closedAt).getTime();
  const hours = (closed - created) / (1000 * 60 * 60);

  const thresholds: Record<
    string,
    { excellent: number; good: number; fair: number }
  > = {
    URGENTE: { excellent: 4, good: 8, fair: 24 },
    ALTA: { excellent: 8, good: 24, fair: 48 },
    MEDIA: { excellent: 24, good: 72, fair: 120 },
    BAJA: { excellent: 72, good: 120, fair: 168 },
  };

  const t = thresholds[ticket.priority] ?? { excellent: 24, good: 72, fair: 120 };
  let score: number;
  if (hours <= t.excellent) score = 100;
  else if (hours <= t.good) score = 80;
  else if (hours <= t.fair) score = 60;
  else score = 40;

  const label =
    score === 100
      ? "Excelente"
      : score === 80
      ? "Bueno"
      : score === 60
      ? "Regular"
      : "Bajo";
  return { score, label, hours: Math.round(hours * 10) / 10 };
};