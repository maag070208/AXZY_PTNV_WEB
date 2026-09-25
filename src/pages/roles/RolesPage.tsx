import { useEffect } from "react";
import { ITPage } from "@axzydev/axzy_ui_system";
import { FaUserShield } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePuede } from "@entities/user";
import { RolesPermisosTabs } from "@features/roles";

export default function RolesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["roles", "common"]);
  const canAdminRoles = usePuede("roles.administrar");

  useEffect(() => {
    if (!canAdminRoles) navigate("/", { replace: true });
  }, [canAdminRoles, navigate]);

  if (!canAdminRoles) return null;

  return (
    <ITPage
      title={t("title")}
      description={t("description")}
      backAction={() => navigate(-1)}
      icon={<FaUserShield size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("title") },
      ]}
    >
      <RolesPermisosTabs />
    </ITPage>
  );
}
