import { ITButton, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { LuKanban, LuListChecks, LuRefreshCw } from "react-icons/lu";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import {
  useAssignmentList,
  AdminTasksTable,
} from "@features/ticket/tasks-table";
import { useGoBack } from "@shared/lib/useGoBack";
import { TicketChip } from "@entities/ticket";

export default function AdminTasksPage() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { t: tt } = useTranslation(["tickets", "common"]);
  const canCompleteTasks = useCan("tasks.complete");

  const fx = useAssignmentList("admintasks.loadError");

  if (!canCompleteTasks) return <Navigate to="/" replace />;

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={tt("admintasks.title")}
      description={tt("admintasks.description", { count: fx.rows.length })}
      backAction={() => goBack("/")}
      icon={<LuListChecks size={20} />}
      breadcrumbs={[
        { label: tt("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: tt("admintasks.breadcrumb") },
      ]}
      actions={
        <ITFlex gap={2}>
          <ITButton variant="outlined" color="secondary" onClick={() => navigate("/tickets/kanban")}>
            <ITFlex align="center" gap={1}>
              <LuKanban size={14} />
              <ITText className="font-bold text-[11px]">{tt("admintasks.viewBoard")}</ITText>
            </ITFlex>
          </ITButton>
          <ITButton variant="outlined" onClick={fx.reload}>
            <ITFlex align="center" gap={1}>
              <LuRefreshCw size={13} />
              <ITText className="font-bold text-[11px]">{tt("admintasks.refresh")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
    >
      <ITFlex justify="end" align="center" gap={2} className="mb-3">
        {fx.loading && (
          <ITText className="text-[12px] font-bold text-slate-400">
            {tt("admintasks.loading")}
          </ITText>
        )}
        {fx.error && (
          <ITText className="text-[12px] font-semibold text-[color:var(--color-danger)]">{fx.error}</ITText>
        )}
        {fx.overdue > 0 && (
          <TicketChip tone="danger" label={tt("admintasks.overdueTasks", { count: fx.overdue })} />
        )}
      </ITFlex>
      <AdminTasksTable fx={fx} />
    </ITPage>
  );
}