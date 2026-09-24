import { ITPage } from "@axzydev/axzy_ui_system";
import { FaUserClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AssignSchedules } from "@features/schedule";

export default function AssignSchedulesPage() {
  const { t } = useTranslation(["schedules", "common"]);
  const navigate = useNavigate();

  return (
    <ITPage
      title={t("assign.title")}
      description={t("assign.description")}
      icon={<FaUserClock size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("title"), onClick: () => navigate("/horarios") },
        { label: t("assign.title") },
      ]}
      backAction={() => navigate("/horarios")}
    >
      <AssignSchedules />
    </ITPage>
  );
}
