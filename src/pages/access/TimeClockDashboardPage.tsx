import { ITPage } from "@axzydev/axzy_ui_system";
import { FaTachometerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TimeClockDashboardView } from "@widgets/time-clock-dashboard";

export default function TimeClockDashboardPage() {
  const { t } = useTranslation("time-clock");
  const navigate = useNavigate();

  return (
    <ITPage
      noPadding
      title={t("dashboard.title")}
      description={t("dashboard.description")}
      icon={<FaTachometerAlt size={20} />}
      breadcrumbs={[{ label: t("dashboard.title") }]}
      backAction={() => navigate("/time-clocks")}
    >
      <div className="p-6">
        <TimeClockDashboardView />
      </div>
    </ITPage>
  );
}
