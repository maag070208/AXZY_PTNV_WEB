import { ITPage } from "@axzydev/axzy_ui_system";
import { FaDoorOpen } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AccessReportTab, useAccessReport } from "@features/access/report";
import { downloadAccessReportPDF } from "@widgets/reports";

export default function AccessReportPage() {
  const { t } = useTranslation(["access-report", "common"]);
  const navigate = useNavigate();
  const fx = useAccessReport({ download: downloadAccessReportPDF });

  return (
    <ITPage
      title={t("title")}
      description={t("description")}
      icon={<FaDoorOpen size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.accessLog"), onClick: () => navigate("/access") },
        { label: t("title") },
      ]}
      backAction={() => navigate("/access")}
    >
      <AccessReportTab fx={fx} />
    </ITPage>
  );
}
