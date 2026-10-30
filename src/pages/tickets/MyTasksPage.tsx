import { ITButton, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { LuKanban, LuListChecks, LuRefreshCw } from "react-icons/lu";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RootState } from "@app/store";
import {
  useAssignmentList,
  MyTasksCards,
  dueGroupOf,
} from "@features/ticket/tasks-table";
import { useGoBack } from "@shared/lib/useGoBack";
import { TicketChip } from "@entities/ticket";

export default function MyTasksPage() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { t: tt } = useTranslation(["tickets", "common"]);
  const fullName = useSelector((s: RootState) => s.auth.user?.name);
  const firstName = fullName?.trim().split(/\s+/)[0] ?? "";

  const fx = useAssignmentList("mytasks.loadError");

  // Saludo con lo pendiente y lo que vence hoy (las completadas no cuentan).
  const open = fx.rows.filter((r) => r.status !== "COMPLETED");
  const dueToday = open.filter((r) => dueGroupOf(r) === "today").length;
  const summary =
    open.length === 0
      ? tt("mytasks.summaryNone")
      : tt("mytasks.summary", { count: open.length }) +
        (dueToday > 0 ? ` · ${tt("mytasks.dueTodayCount", { count: dueToday })}` : "");

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={firstName ? tt("mytasks.greeting", { name: firstName }) : tt("mytasks.title")}
      description={summary}
      backAction={() => goBack("/")}
      icon={<LuListChecks size={20} />}
      breadcrumbs={[
        { label: tt("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: tt("mytasks.breadcrumb") },
      ]}
      actions={
        <ITFlex gap={2}>
          <ITButton variant="outlined" color="secondary" onClick={fx.reload}>
            <ITFlex align="center" gap={1}>
              <LuRefreshCw size={13} />
              <ITText className="font-bold text-[11px]">{tt("mytasks.refresh")}</ITText>
            </ITFlex>
          </ITButton>
          <ITButton variant="outlined" color="secondary" onClick={() => navigate("/tickets/kanban")}>
            <ITFlex align="center" gap={1}>
              <LuKanban size={14} />
              <ITText className="font-bold text-[11px]">{tt("mytasks.viewBoard")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
    >
      <ITFlex align="center" gap={2} className="mb-3 min-h-6">
        {fx.loading && <ITText className="text-[12px] font-semibold text-slate-400">{tt("mytasks.loading")}</ITText>}
        {fx.error && <ITText className="text-[12px] font-semibold text-[color:var(--color-danger)]">{fx.error}</ITText>}
        {fx.overdue > 0 && <TicketChip tone="danger" label={tt("mytasks.overdueTasks", { count: fx.overdue })} />}
      </ITFlex>

      <MyTasksCards fx={fx} onOpenBoard={() => navigate("/tickets/kanban")} />
    </ITPage>
  );
}
