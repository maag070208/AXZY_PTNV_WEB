import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ITBadget } from "@axzydev/axzy_ui_system";
import { LuCircleCheckBig, LuClock, LuEye, LuListChecks, LuPlay } from "react-icons/lu";
import { dashboardApi } from "@entities/dashboard";
import { dyn } from "@shared/i18n/dyn";
import { formatDate } from "@shared/utils/dates";
import { useWidgetData } from "../../model/useWidgetData";
import { alarmTone } from "../../model/alarmTone";
import WidgetCard, { EmptyText, ListRow, Metric, MetricGrid, RowList, SectionLabel } from "../WidgetCard";

/** Tareas con el alcance de `tasks.view`: las propias, las de su equipo o todas. */
export default function TasksWidget() {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const navigate = useNavigate();
  const { data, loading, error, reload } = useWidgetData(dashboardApi.tasks);
  const totalTasks = data ? data.pending + data.inProgress + data.inReview + data.completed : 0;
  const title = !data || data.scope === "ALL" ? t("tasks.title") : data.scope === "AREA" ? t("tasks.titleArea") : t("tasks.titleOwn");

  return (
    <WidgetCard
      title={title}
      icon={<LuListChecks size={16} />}
      to={data?.scope === "OWN" ? "/tickets/my-tasks" : "/tickets/tasks"}
      loading={loading}
      error={error}
      onRetry={reload}
    >
      {data && (
        <>
          <MetricGrid>
            <Metric value={data.pending} label={t("tasks.pending")} tone={alarmTone(data.pending, "amber")} icon={<LuClock size={14} />} />
            <Metric value={data.inProgress} label={t("tasks.inProgress")} tone={alarmTone(data.inProgress, "sky")} icon={<LuPlay size={14} />} />
            <Metric value={data.inReview} label={t("tasks.inReview")} tone={alarmTone(data.inReview, "violet")} icon={<LuEye size={14} />} />
            <Metric
              value={data.completed}
              label={t("tasks.completed")}
              tone={alarmTone(data.completed, "emerald")}
              icon={<LuCircleCheckBig size={14} />}
              hint={t("tasks.ofTotal", { total: totalTasks })}
              ratio={totalTasks > 0 ? data.completed / totalTasks : undefined}
            />
          </MetricGrid>
          <SectionLabel>
            <span className="flex items-center gap-2">
              {t("tasks.overdue")}
              {data.overdue.length > 0 && (
                <span className="rounded-full bg-[var(--color-danger-soft)] px-2 py-0.5 text-[11px] font-bold text-[color:var(--color-danger)]">
                  {data.overdue.length}
                </span>
              )}
            </span>
          </SectionLabel>
          {data.overdue.length === 0 ? (
            <EmptyText>{t("empty")}</EmptyText>
          ) : (
            <RowList>
              {data.overdue.map((task) => (
                <ListRow
                  key={task.id}
                  avatarName={task.name}
                  title={task.title}
                  subtitle={task.name}
                  right={
                    task.dueDate ? (
                      <ITBadget color="danger" size="sm">
                        {t("tasks.due", { date: formatDate(task.dueDate) })}
                      </ITBadget>
                    ) : undefined
                  }
                  onClick={() => navigate(`/tickets/${task.ticketId}`)}
                />
              ))}
            </RowList>
          )}
          {data.scope !== "OWN" && (
            <>
              <SectionLabel>{t("tasks.byUser")}</SectionLabel>
              {data.pendingByUser.length === 0 ? (
                <EmptyText>{t("empty")}</EmptyText>
              ) : (
                <RowList>
                  {data.pendingByUser.map((p) => (
                    <ListRow
                      key={p.userId}
                      avatarName={p.name}
                      title={p.name}
                      right={
                        <ITBadget color="warning" size="sm">
                          {p.pending}
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
