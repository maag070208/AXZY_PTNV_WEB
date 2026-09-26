import { ITPage } from "@axzydev/axzy_ui_system";
import { FaClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChecadorRelojesTab, useChecadorRelojes } from "@features/access/checador-relojes";

export default function ChecadorRelojesPage() {
  const { t } = useTranslation(["checador", "common"]);
  const navigate = useNavigate();
  const fx = useChecadorRelojes();

  return (
    <ITPage
      title={t("relojes.title")}
      description={t("relojes.description")}
      icon={<FaClock size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("relojes.title") },
      ]}
      backAction={() => navigate(-1)}
    >
      <ChecadorRelojesTab fx={fx} />
    </ITPage>
  );
}
