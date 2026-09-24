import { ITPage } from "@axzydev/axzy_ui_system";
import { FaFingerprint } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChecadorTab, useChecador } from "@features/access/checador";

export default function ChecadorPage() {
  const { t } = useTranslation(["checador", "common"]);
  const navigate = useNavigate();
  const fx = useChecador();

  return (
    <ITPage
      title={t("title")}
      description={t("description")}
      icon={<FaFingerprint size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.access"), onClick: () => navigate("/access") },
        { label: t("title") },
      ]}
      backAction={() => navigate("/access")}
    >
      <ChecadorTab fx={fx} />
    </ITPage>
  );
}
