import { ITPage } from "@axzydev/axzy_ui_system";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TimeClockInspectView } from "@features/access/time-clock-inspect";

export default function TimeClockInspectPage() {
  const { t } = useTranslation("time-clock");
  const navigate = useNavigate();

  return (
    <ITPage
      noPadding
      title={t("inspect.title")}
      description={t("inspect.description")}
      icon={<FaSearch size={20} />}
      breadcrumbs={[{ label: t("inspect.title") }]}
      backAction={() => navigate("/time-clocks")}
    >
      <TimeClockInspectView />
    </ITPage>
  );
}
