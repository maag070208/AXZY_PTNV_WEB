import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ITBadget } from "@axzydev/axzy_ui_system";
import { LuListChecks } from "react-icons/lu";
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
            <Metric value={data.pending} label={t("tasks.pending")} tone={alarmTone(data.pending, "amber")} />
            <Metric value={data.inProgress} label={t("tasks.inProgress")} tone={alarmTone(data.inProgress, "sky")} />
            <Metric value={data.inReview} label={t("tasks.inReview")} tone={alarmTone(data.inReview, "violet")} />
            <Metric
              value={data.completed}
              label={t("tasks.completed")}
              tone={alarmTone(data.completed, "emerald")}
              ratio={totalTasks > 0 ? data.completed / totalTasks : undefined}
            />
            <Metric value={data.overdue.length} label={t("tasks.overdue")} tone={alarmTone(data.overdue.length, "rose")} />
          </MetricGrid>
          <SectionLabel>{t("tasks.overdue")}</SectionLabel>
          {data.overdue.length === 0 ? (
            <EmptyText>{t("empty")}</EmptyText>
          ) : (
            <RowList>
              {data.overdue.map((task) => (
                <ListRow
                  key={task.id}
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
