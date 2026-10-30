import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ITBadget, ITText } from "@axzydev/axzy_ui_system";
import { LuCircleCheck, LuClock, LuInbox, LuTicket, LuUserX } from "react-icons/lu";
import { dashboardApi } from "@entities/dashboard";
import { PRIORITY_BADGE, daysOnHold } from "@entities/ticket";
import { dyn } from "@shared/i18n/dyn";
import { useWidgetData } from "../../model/useWidgetData";
import { alarmTone } from "../../model/alarmTone";
import WidgetCard, { EmptyText, ListRow, Metric, MetricGrid, RowList, SectionLabel } from "../WidgetCard";

/**
 * Tickets con el alcance de `tickets.view`: los propios (empleado), los de su
 * departamento (jefe de área) o todos; antiguos y abiertos por responsable.
 */
export default function TicketsWidget() {
  const { t: tt } = useTranslation(["dashboard", "tickets"]);
  const t = dyn(tt);
  const navigate = useNavigate();
  const { data, loading, error, reload } = useWidgetData(dashboardApi.tickets);
  const totalTickets = data ? data.open + data.inProgress + data.closed : 0;
  const title = !data || data.scope === "ALL" ? t("tickets.title") : data.scope === "AREA" ? t("tickets.titleArea") : t("tickets.titleOwn");

  return (
    <WidgetCard title={title} icon={<LuTicket size={16} />} to="/tickets" loading={loading} error={error} onRetry={reload}>
      {data && (
        <>
          <MetricGrid>
            <Metric
              value={data.open}
              label={t("tickets.open")}
              tone={alarmTone(data.open, "amber")}
              icon={<LuInbox size={14} />}
              hint={t("tickets.ofTotal", { total: totalTickets })}
            />
            <Metric value={data.inProgress} label={t("tickets.inProgress")} tone={alarmTone(data.inProgress, "sky")} icon={<LuClock size={14} />} />
            <Metric value={data.unassigned} label={t("tickets.unassigned")} tone={alarmTone(data.unassigned, "rose")} icon={<LuUserX size={14} />} />
            <Metric
              value={data.closed}
              label={t("tickets.closed")}
              tone={alarmTone(data.closed, "emerald")}
              icon={<LuCircleCheck size={14} />}
              hint={totalTickets > 0 ? `${Math.round((data.closed / totalTickets) * 100)}%` : undefined}
              ratio={totalTickets > 0 ? data.closed / totalTickets : undefined}
            />
          </MetricGrid>
          <SectionLabel>{t("tickets.stale", { days: data.staleDays })}</SectionLabel>
          {data.stale.length === 0 ? (
            <EmptyText>{t("empty")}</EmptyText>
          ) : (
            <RowList>
              {data.stale.map((ticket) => (
                <ListRow
                  key={ticket.id}
                  avatarName={ticket.assignedTo}
                  avatarPlaceholder
                  title={ticket.title}
                  subtitle={ticket.assignedTo ?? t("tickets.unassignedLabel")}
                  right={
                    <ITText as="span" className="flex items-center gap-2">
                      <ITBadget color={(PRIORITY_BADGE[ticket.priority as keyof typeof PRIORITY_BADGE]?.color as never) ?? "gray"} size="sm">
                        {t(`tickets:priorityLabels.${ticket.priority}`)}
                      </ITBadget>
                      <ITText as="span" className="rounded-full bg-[var(--color-danger-soft)] px-2 py-0.5 text-[11px] font-bold text-[color:var(--color-danger)]">
                        {daysOnHold(ticket.createdAt, null)} d
                      </ITText>
                    </ITText>
                  }
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                />
              ))}
            </RowList>
          )}
          {data.scope !== "OWN" && (
            <>
              <SectionLabel>{t("tickets.byAssignee")}</SectionLabel>
              {data.openByAssignee.length === 0 ? (
                <EmptyText>{t("empty")}</EmptyText>
              ) : (
                <RowList>
                  {data.openByAssignee.map((p) => (
                    <ListRow
                      key={p.userId}
                      avatarName={p.name}
                      title={p.name}
                      right={
                        <ITBadget color="warning" size="sm">
                          {p.open}
                        </ITBadget>
                      }
                    />
                  ))}
                </RowList>
              )}
            </>
          )}
        </>
      )}
    </WidgetCard>
  );
}
