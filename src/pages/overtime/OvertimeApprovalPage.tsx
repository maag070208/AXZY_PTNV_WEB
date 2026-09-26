import { ITPage } from "@axzydev/axzy_ui_system";
import { FaClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import { OvertimeApprovalTable, useOvertimeApproval } from "@features/schedule";
import { downloadOvertimePDF } from "@widgets/reports";

export default function OvertimeApprovalPage() {
  const { t } = useTranslation(["overtime", "common"]);
  const navigate = useNavigate();
  const canApprove = useCan("overtime.approve");
  const fx = useOvertimeApproval({ canApprove, downloadPdf: downloadOvertimePDF });

  return (
    <ITPage
      title={t("title")}
      description={t("description")}
      icon={<FaClock size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.schedules"), onClick: () => navigate("/schedules") },
        { label: t("title") },
      ]}
      backAction={() => navigate("/schedules")}
    >
      <OvertimeApprovalTable fx={fx} />
    </ITPage>
  );
}
