import { ITPage } from "@axzydev/axzy_ui_system";
import { FaClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TimeClocksTab, useTimeClocks } from "@features/access/time-clocks";

export default function TimeClocksPage() {
  const { t } = useTranslation(["time-clock", "common"]);
  const navigate = useNavigate();
  const fx = useTimeClocks();

  return (
    <ITPage
      title={t("clocks.title")}
      description={t("clocks.description")}
      icon={<FaClock size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("clocks.title") },
      ]}
      backAction={() => navigate(-1)}
    >
      <TimeClocksTab fx={fx} />
    </ITPage>
  );
}
