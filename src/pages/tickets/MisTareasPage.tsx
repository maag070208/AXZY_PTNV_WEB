import { ITBadget, ITButton, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaSync, FaTasks, FaTrello } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useAssignmentList,
  MyTasksTable,
} from "@features/ticket/tasks-table";

export default function MisTareasPage() {
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["tickets", "common"]);

  const fx = useAssignmentList("mytasks.loadError");

  return (
    <ITPage
      title={tt("mytasks.title")}
      description={tt("mytasks.description", { count: fx.rows.length })}
      backAction={() => navigate(-1)}
      icon={<FaTasks size={20} />}
      breadcrumbs={[
        { label: tt("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: tt("mytasks.breadcrumb") },
      ]}
      actions={
        <ITButton variant="outlined" color="secondary" onClick={() => navigate("/tickets/kanban")}>
          <ITFlex align="center" gap={1}>
            <FaTrello size={12} />
            <ITText className="font-bold text-[11px]">{tt("mytasks.viewBoard")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <ITFlex justify="end" align="center" gap={2} className="mb-3">
        {fx.loading && (
          <ITText className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {tt("mytasks.loading")}
          </ITText>
        )}
        {fx.error && (
          <ITText className="text-[11px] font-bold text-red-600">{fx.error}</ITText>
        )}
        {fx.vencidas > 0 && (
          <ITBadget color="danger" size="sm">
            {tt("mytasks.overdueTasks", { count: fx.vencidas })}
          </ITBadget>
        )}
        <ITButton variant="outlined" onClick={fx.reload}>
          <ITFlex align="center" gap={1}>
            <FaSync size={11} />
            <ITText className="font-bold text-[11px]">{tt("mytasks.refresh")}</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      <MyTasksTable fx={fx} onOpenBoard={() => navigate("/tickets/kanban")} />
    </ITPage>
  );
}