import { ITTabs } from "@axzydev/axzy_ui_system";
import { FaUserShield, FaListUl } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useRolesAdmin } from "@features/roles";
import RoleAccessPanel from "./RoleAccessPanel";
import PermissionCatalogPanel from "./PermissionCatalogPanel";

export default function RolesPermissionsTabs() {
  const { t } = useTranslation("roles");
  // El borrador vive aquí para que no se pierda al cambiar de pestaña.
  const admin = useRolesAdmin();

  return (
    <ITTabs
      variant="line"
      defaultActiveId="access"
      items={[
        {
          id: "access",
          label: t("tabs.access"),
          icon: <FaUserShield size={12} />,
          content: <RoleAccessPanel admin={admin} />,
        },
        {
          id: "catalog",
          label: t("tabs.catalog"),
          icon: <FaListUl size={12} />,
          content: <PermissionCatalogPanel />,
        },
      ]}
    />
  );
}
