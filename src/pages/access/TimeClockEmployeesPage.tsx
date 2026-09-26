import { ITPage } from "@axzydev/axzy_ui_system";
import { FaLink } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TimeClockEmployeesTab, useTimeClockEmployees } from "@features/access/time-clock-employees";

export default function TimeClockEmployeesPage() {
  const { t } = useTranslation(["time-clock", "common"]);
  const navigate = useNavigate();
  const fx = useTimeClockEmployees();

  return (
    <ITPage
      title={t("employees.title")}
      description={t("employees.description")}
      icon={<FaLink size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.access"), onClick: () => navigate("/access") },
        { label: t("employees.title") },
      ]}
      backAction={() => navigate("/access/time-clock")}
    >
      <TimeClockEmployeesTab fx={fx} />
    </ITPage>
  );
}
