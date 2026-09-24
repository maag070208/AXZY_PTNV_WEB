import { ITPage } from "@axzydev/axzy_ui_system";
import { FaFingerprint } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RootState } from "@app/store";
import { ChecadorTab, useChecador } from "@features/access/checador";

export default function ChecadorPage() {
  const { t } = useTranslation(["checador", "common"]);
  const navigate = useNavigate();
  const fx = useChecador();
  // Dar de alta/baja relojes es solo de ADMIN (igual que en la API).
  const esAdmin = useSelector((s: RootState) => s.auth.user?.role) === "ADMIN";

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
      <ChecadorTab
        fx={fx}
        onAdministrarRelojes={esAdmin ? () => navigate("/relojes") : undefined}
      />
    </ITPage>
  );
}
