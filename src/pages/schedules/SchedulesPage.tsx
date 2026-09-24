import { ITPage } from "@axzydev/axzy_ui_system";
import { FaRegClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SchedulesTable } from "@features/schedule";

export default function SchedulesPage() {
  const { t } = useTranslation(["schedules", "common"]);
  const navigate = useNavigate();

  return (
    <ITPage
      title={t("title")}
      description={t("description")}
      icon={<FaRegClock size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("title") },
      ]}
      backAction={() => navigate(-1)}
    >
      <SchedulesTable />
    </ITPage>
  );
}
