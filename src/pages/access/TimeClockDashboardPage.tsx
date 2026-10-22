import { ITPage } from "@axzydev/axzy_ui_system";
import { FaHouseUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TimeClockDashboardView } from "@widgets/time-clock-dashboard";

export default function TimeClockDashboardPage() {
  const { t } = useTranslation("time-clock");
  const navigate = useNavigate();

  return (
    <ITPage
      noPadding
      className="m-0! p-0! px-8! min-w-full!"
      title={t("dashboard.title")}
      description={t("dashboard.description")}
      icon={<FaHouseUser size={20} />}
      breadcrumbs={[{ label: t("dashboard.title") }]}
      backAction={() => navigate("/time-clocks")}
    >
      <TimeClockDashboardView />
    </ITPage>
  );
}
