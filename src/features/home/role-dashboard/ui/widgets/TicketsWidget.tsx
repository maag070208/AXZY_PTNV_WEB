import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ITBadget, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaTicketAlt } from "react-icons/fa";
import { dashboardApi } from "@entities/dashboard";
import { PRIORITY_BADGE, daysOnHold } from "@entities/ticket";
import { dyn } from "@shared/i18n/dyn";
import { useWidgetData } from "../../model/useWidgetData";
import WidgetCard, { Metric, SectionLabel } from "../WidgetCard";

/**
 * Tickets con el alcance de `tickets.view`: los propios (empleado), los de su
 * departamento (jefe de área) o todos; antiguos y abiertos por responsable.
 */
export default function TicketsWidget() {
  const { t: tt } = useTranslation(["dashboard", "tickets"]);
  const t = dyn(tt);
  const navigate = useNavigate();
  const { data, loading, error, reload } = useWidgetData(dashboardApi.tickets);
  const title = !data || data.scope === "ALL" ? t("tickets.title") : data.scope === "AREA" ? t("tickets.titleArea") : t("tickets.titleOwn");

  return (
    <WidgetCard title={title} icon={<FaTicketAlt size={13} />} iconClass="bg-amber-500" to="/tickets" loading={loading} error={error} onRetry={reload}>
      {data && (
        <>
          <ITFlex wrap="wrap" gap={2}>
            <Metric value={data.open} label={t("tickets.open")} tone="text-amber-600" />
            <Metric value={data.inProgress} label={t("tickets.inProgress")} tone="text-sky-700" />
            <Metric value={data.unassigned} label={t("tickets.unassigned")} tone={data.unassigned ? "text-rose-600" : "text-slate-800"} />
            <Metric value={data.closed} label={t("tickets.closed")} tone="text-emerald-700" />
          </ITFlex>
          <SectionLabel>{t("tickets.stale", { days: data.staleDays })}</SectionLabel>
          {data.stale.length === 0 ? (
            <ITText className="text-[11px] text-slate-400">{t("empty")}</ITText>
          ) : (
            data.stale.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="flex w-full items-center justify-between border-b border-slate-100 py-1 text-left hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <div className="truncate text-[11px] font-bold text-slate-800">{ticket.title}</div>
                  <div className="text-[9px] uppercase text-slate-400">{ticket.assignedTo ?? t("tickets.unassignedLabel")}</div>
                </div>
                <ITFlex align="center" gap={1}>
                  <ITBadget color={(PRIORITY_BADGE[ticket.priority as keyof typeof PRIORITY_BADGE]?.color as never) ?? "gray"} size="sm">
                    {t(`tickets:priorityLabels.${ticket.priority}`)}
                  </ITBadget>
                  <ITText className="text-[10px] font-black text-rose-600">{daysOnHold(ticket.createdAt, null)} d</ITText>
                </ITFlex>
              </button>
            ))
          )}
          {data.scope !== "OWN" && (
            <>
              <SectionLabel>{t("tickets.byAssignee")}</SectionLabel>
              {data.openByAssignee.length === 0 ? (
                <ITText className="text-[11px] text-slate-400">{t("empty")}</ITText>
              ) : (
                data.openByAssignee.map((p) => (
                  <ITFlex key={p.userId} justify="between" className="border-b border-slate-100 py-1">
                    <ITText className="text-[11px] font-bold text-slate-800">{p.name}</ITText>
                    <ITText className="text-[11px] font-black text-amber-600">{p.open}</ITText>
                  </ITFlex>
                ))
              )}
            </>
          )}
        </>
      )}
    </WidgetCard>
  );
}
