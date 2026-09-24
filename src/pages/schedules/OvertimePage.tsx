import { ITPage } from "@axzydev/axzy_ui_system";
import { FaClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { OvertimeReport } from "@features/schedule";

export default function OvertimePage() {
  const { t } = useTranslation(["schedules", "common"]);
  const navigate = useNavigate();

  return (
    <ITPage
      title={t("overtime.title")}
      description={t("overtime.description")}
      icon={<FaClock size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("title"), onClick: () => navigate("/horarios") },
        { label: t("overtime.title") },
      ]}
      backAction={() => navigate("/horarios")}
    >
      <OvertimeReport />
    </ITPage>
  );
}
