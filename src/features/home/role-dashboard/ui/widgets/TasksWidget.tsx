import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaTasks } from "react-icons/fa";
import { dashboardApi } from "@entities/dashboard";
import { dyn } from "@shared/i18n/dyn";
import { formatDate } from "@shared/utils/dates";
import { useWidgetData } from "../../model/useWidgetData";
import WidgetCard, { Metric, SectionLabel } from "../WidgetCard";

/** Tareas con el alcance de `tasks.view`: las propias, las de su equipo o todas. */
export default function TasksWidget() {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const navigate = useNavigate();
  const { data, loading, error, reload } = useWidgetData(dashboardApi.tasks);
  const title = !data || data.scope === "ALL" ? t("tasks.title") : data.scope === "AREA" ? t("tasks.titleArea") : t("tasks.titleOwn");

  return (
    <WidgetCard
      title={title}
      icon={<FaTasks size={13} />}
      iconClass="bg-indigo-600"
      to={data?.scope === "OWN" ? "/tickets/my-tasks" : "/tickets/tasks"}
      loading={loading}
      error={error}
      onRetry={reload}
    >
      {data && (
        <>
          <ITFlex wrap="wrap" gap={2}>
            <Metric value={data.pending} label={t("tasks.pending")} tone="text-amber-600" />
            <Metric value={data.inProgress} label={t("tasks.inProgress")} tone="text-sky-700" />
            <Metric value={data.inReview} label={t("tasks.inReview")} tone="text-violet-700" />
            <Metric value={data.overdue.length} label={t("tasks.overdue")} tone={data.overdue.length ? "text-rose-600" : "text-slate-800"} />
          </ITFlex>
          <SectionLabel>{t("tasks.overdue")}</SectionLabel>
          {data.overdue.length === 0 ? (
            <ITText className="text-[11px] text-slate-400">{t("empty")}</ITText>
          ) : (
            data.overdue.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => navigate(`/tickets/${task.ticketId}`)}
                className="flex w-full items-center justify-between border-b border-slate-100 py-1 text-left hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <div className="truncate text-[11px] font-bold text-slate-800">{task.title}</div>
                  <div className="text-[9px] uppercase text-slate-400">{task.name}</div>
                </div>
                <ITText className="text-[10px] font-bold text-rose-600">
                  {task.dueDate ? t("tasks.due", { date: formatDate(task.dueDate) }) : ""}
                </ITText>
              </button>
            ))
          )}
          {data.scope !== "OWN" && (
            <>
              <SectionLabel>{t("tasks.byUser")}</SectionLabel>
              {data.pendingByUser.length === 0 ? (
                <ITText className="text-[11px] text-slate-400">{t("empty")}</ITText>
              ) : (
                data.pendingByUser.map((p) => (
                  <ITFlex key={p.userId} justify="between" className="border-b border-slate-100 py-1">
                    <ITText className="text-[11px] font-bold text-slate-800">{p.name}</ITText>
                    <ITText className="text-[11px] font-black text-amber-600">{p.pending}</ITText>
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
