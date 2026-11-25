import { AppPage } from "@shared/ui/app-page";
import { FaRegCalendarAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShiftRoster } from "@features/schedule";
import { useGoBack } from "@shared/lib/useGoBack";

export default function ShiftRosterPage() {
  const { t } = useTranslation(["schedules", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();

  return (
    <AppPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("roster.title")}
      description={t("roster.description")}
      icon={<FaRegCalendarAlt size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("title"), onClick: () => navigate("/schedules") },
        { label: t("roster.title") },
      ]}
      backAction={() => goBack("/schedules")}
    >
      <ShiftRoster />
    </AppPage>
  );
}
