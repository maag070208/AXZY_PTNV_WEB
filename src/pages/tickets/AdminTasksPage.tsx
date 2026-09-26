import { ITBadget, ITButton, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaSync, FaTasks, FaTrello } from "react-icons/fa";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import {
  useAssignmentList,
  AdminTasksTable,
} from "@features/ticket/tasks-table";

export default function AdminTasksPage() {
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["tickets", "common"]);
  const canCompleteTasks = useCan("tasks.complete");

  const fx = useAssignmentList("admintasks.loadError");

  if (!canCompleteTasks) return <Navigate to="/" replace />;

  return (
    <ITPage
      title={tt("admintasks.title")}
      description={tt("admintasks.description", { count: fx.rows.length })}
      backAction={() => navigate(-1)}
      icon={<FaTasks size={20} />}
      breadcrumbs={[
        { label: tt("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: tt("admintasks.breadcrumb") },
      ]}
      actions={
        <ITFlex gap={2}>
          <ITButton variant="outlined" color="secondary" onClick={() => navigate("/tickets/kanban")}>
            <ITFlex align="center" gap={1}>
              <FaTrello size={12} />
              <ITText className="font-bold text-[11px]">{tt("admintasks.viewBoard")}</ITText>
            </ITFlex>
          </ITButton>
          <ITButton variant="outlined" onClick={fx.reload}>
            <ITFlex align="center" gap={1}>
              <FaSync size={11} />
              <ITText className="font-bold text-[11px]">{tt("admintasks.refresh")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
    >
      <ITFlex justify="end" align="center" gap={2} className="mb-3">
        {fx.loading && (
          <ITText className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {tt("admintasks.loading")}
          </ITText>
        )}
        {fx.error && (
          <ITText className="text-[11px] font-bold text-red-600">{fx.error}</ITText>
        )}
        {fx.overdue > 0 && (
          <ITBadget color="danger" size="lg">
            {tt("admintasks.overdueTasks", { count: fx.overdue })}
          </ITBadget>
        )}
      </ITFlex>
      <AdminTasksTable fx={fx} />
    </ITPage>
  );
}