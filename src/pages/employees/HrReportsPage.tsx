import {
  ITAlert,
  ITButton,
  ITConfirmDialog,
  ITFlex,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaPlus, FaScroll } from "react-icons/fa6";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { DisciplinaryReport } from "@entities/hr";
import {
  useDisciplinaryReports,
  DisciplinaryReportsTable,
  DisciplinaryReportForm,
} from "@features/hr/disciplinary-reports";

export default function HrReportsPage() {
  const { t: tt } = useTranslation(["disciplinary-reports", "common"]);
  const navigate = useNavigate();
  const fx = useDisciplinaryReports();
  const [disciplinaryReportToDelete, setDisciplinaryReportToDelete] = useState<DisciplinaryReport | null>(null);

  return (
    <ITPage
      title={tt("title")}
      description={tt("description")}
      backAction={() => navigate(-1)}
      icon={<FaScroll size={20} />}
      breadcrumbs={[
        { label: tt("common:nav.home"), onClick: () => navigate("/") },
        { label: tt("breadcrumb") },
      ]}
      actions={
        <ITButton variant="filled" color="primary" onClick={() => fx.setShowForm(true)}>
          <ITFlex align="center" gap={1}>
            <FaPlus size={12} />
            <ITText className="font-bold text-[11px]">{tt("newDisciplinaryReport")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      <DisciplinaryReportsTable
        fetchData={fx.fetchTableData}
        reloadKey={fx.reloadKey}
        onView={(disciplinaryReport) => navigate(`/employees/disciplinary-reports/${disciplinaryReport.id}`)}
        onDelete={(disciplinaryReport) => setDisciplinaryReportToDelete(disciplinaryReport)}
      />

      <DisciplinaryReportForm
        isOpen={fx.showForm}
        saving={fx.saving}
        onClose={() => fx.setShowForm(false)}
        onSave={(input) => void fx.createDisciplinaryReport(input)}
      />

      <ITConfirmDialog
        isOpen={!!disciplinaryReportToDelete}
        onClose={() => setDisciplinaryReportToDelete(null)}
        onConfirm={() => {
          if (disciplinaryReportToDelete) void fx.deleteDisciplinaryReport(disciplinaryReportToDelete.id);
          setDisciplinaryReportToDelete(null);
        }}
        title={tt("actions.delete")}
        message={tt("form.deleteConfirm", {
          name: disciplinaryReportToDelete?.user.name ?? "",
        })}
        confirmLabel={tt("actions.delete")}
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />
    </ITPage>
  );
}