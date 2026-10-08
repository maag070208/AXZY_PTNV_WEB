import { ITPage } from "@axzydev/axzy_ui_system";
import { FaExchangeAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  TimeClockDifferencesTab,
  useTimeClockDifferences,
} from "@features/access/time-clock-differences";

export default function TimeClockDifferencesPage() {
  const { t } = useTranslation(["time-clock", "common"]);
  const navigate = useNavigate();
  const fx = useTimeClockDifferences();

  return (
    <ITPage
      noPadding
      title={t("differences.title")}
      description={t("differences.description")}
      icon={<FaExchangeAlt size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.hr"), onClick: () => navigate("/employees") },
        { label: t("employees.title"), onClick: () => navigate("/hr/time-clock/employees") },
        { label: t("differences.title") },
      ]}
      backAction={() => navigate("/hr/time-clock/employees")}
    >
      <TimeClockDifferencesTab fx={fx} />
    </ITPage>
  );
}
