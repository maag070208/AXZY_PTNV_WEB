import { AppPage } from "@shared/ui/app-page";
import { ITButton } from "@axzydev/axzy_ui_system";
import { FaRegClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SchedulesBoard } from "@features/schedule";
import { useGoBack } from "@shared/lib/useGoBack";

export default function SchedulesPage() {
  const { t } = useTranslation(["schedules", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();

  return (
    <AppPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("title")}
      description={t("description")}
      icon={<FaRegClock size={20} />}
      actions={
        <ITButton variant="outlined" color="secondary" size="sm" onClick={() => navigate("/schedules/roster")}>
          {t("roster.open")}
        </ITButton>
      }
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("title") },
      ]}
      backAction={() => goBack("/")}
    >
      <SchedulesBoard />
    </AppPage>
  );
}
