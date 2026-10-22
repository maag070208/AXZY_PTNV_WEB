import { ITPage } from "@axzydev/axzy_ui_system";
import { FaClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TimeClockPanelView } from "@widgets/time-clock-panel";

export default function TimeClockPanelPage() {
  const { t } = useTranslation("time-clock");
  const navigate = useNavigate();

  return (
    <ITPage
      noPadding
      title={t("panel.title")}
      description={t("panel.description")}
      icon={<FaClock size={20} />}
      breadcrumbs={[{ label: t("panel.title") }]}
      backAction={() => navigate("/time-clocks")}
    >
      <TimeClockPanelView />
    </ITPage>
  );
}
