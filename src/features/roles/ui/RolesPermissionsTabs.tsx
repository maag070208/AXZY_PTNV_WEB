import { ITTabs } from "@axzydev/axzy_ui_system";
import { FaTable, FaListUl } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import RoleMatrixPanel from "./RoleMatrixPanel";
import PermissionCatalogPanel from "./PermissionCatalogPanel";

export default function RolesPermissionsTabs() {
  const { t } = useTranslation("roles");

  return (
    <ITTabs
      variant="line"
      defaultActiveId="matrix"
      items={[
        {
          id: "matrix",
          label: t("tabs.matrix"),
          icon: <FaTable size={12} />,
          content: <RoleMatrixPanel />,
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
