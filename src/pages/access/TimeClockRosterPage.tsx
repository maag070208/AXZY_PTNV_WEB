import { ITPage } from "@axzydev/axzy_ui_system";
import { FaUsersCog } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TimeClockRosterView } from "@features/access/time-clock-roster";

export default function TimeClockRosterPage() {
  const { t } = useTranslation("time-clock");
  const navigate = useNavigate();

  return (
    <ITPage
      noPadding
      title={t("roster.title")}
      description={t("roster.description")}
      icon={<FaUsersCog size={20} />}
      breadcrumbs={[
        { label: t("roster.title"), onClick: () => navigate("/hr/time-clock/roster") },
      ]}
      backAction={() => navigate("/hr/time-clock")}
    >
      <TimeClockRosterView />
    </ITPage>
  );
}
