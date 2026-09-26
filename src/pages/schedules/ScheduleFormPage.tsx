import { ITPage } from "@axzydev/axzy_ui_system";
import { FaRegClock } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ScheduleForm } from "@features/schedule";

export default function ScheduleFormPage() {
  const { t } = useTranslation(["schedules", "common"]);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  return (
    <ITPage
      title={isEdit ? t("edit") : t("new")}
      icon={<FaRegClock size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("title"), onClick: () => navigate("/schedules") },
        { label: isEdit ? t("edit") : t("new") },
      ]}
      backAction={() => navigate("/schedules")}
    >
      <ScheduleForm id={id} />
    </ITPage>
  );
}
