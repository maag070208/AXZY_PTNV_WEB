import { ITPage } from "@axzydev/axzy_ui_system";
import { FaUsersCog } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TimeClockPeopleView } from "@features/access/time-clock-people";

export default function TimeClockPeoplePage() {
  const { t } = useTranslation("time-clock");
  const navigate = useNavigate();

  return (
    <ITPage
      noPadding
      title={t("people.title")}
      description={t("people.description")}
      icon={<FaUsersCog size={20} />}
      breadcrumbs={[{ label: t("people.title") }]}
      backAction={() => navigate("/time-clocks")}
    >
      <TimeClockPeopleView />
    </ITPage>
  );
}
