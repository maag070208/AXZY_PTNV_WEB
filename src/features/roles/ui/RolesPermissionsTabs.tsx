import { ITTabs } from "@axzydev/axzy_ui_system";
import { FaTable, FaListUl } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import MatrizRolesPanel from "./MatrizRolesPanel";
import CatalogoPermisosPanel from "./CatalogoPermisosPanel";

export default function RolesPermisosTabs() {
  const { t } = useTranslation("roles");

  return (
    <ITTabs
      variant="line"
      defaultActiveId="matriz"
      items={[
        {
          id: "matriz",
          label: t("tabs.matriz"),
          icon: <FaTable size={12} />,
          content: <MatrizRolesPanel />,
        },
        {
          id: "catalogo",
          label: t("tabs.catalogo"),
          icon: <FaListUl size={12} />,
          content: <CatalogoPermisosPanel />,
        },
      ]}
    />
  );
}
