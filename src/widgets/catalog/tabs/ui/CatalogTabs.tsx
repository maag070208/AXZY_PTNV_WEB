import { ITTabs } from "@axzydev/axzy_ui_system";
import { FaBuilding, FaTint, FaFileAlt, FaMicrochip, FaNetworkWired, FaVenusMars, FaEnvelope } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { DepartamentosPanel } from "@widgets/catalog/departamentos";
import { SubareasPanel } from "@widgets/catalog/subareas";
import {
  TiposDispositivoTab,
  TiposDocumentoTab,
  GenerosTab,
  TiposSangreTab,
} from "@features/catalog";
import { SysConfigTab } from "@features/sys-config";

export default function CatalogTabs() {
  const { t } = useTranslation("catalog");

  const items = [
    {
      id: "departamentos",
      label: t("tabs.departamentos"),
      icon: <FaBuilding size={13} />,
      content: <DepartamentosPanel />,
    },
    {
      id: "subareas",
      label: t("tabs.subareas"),
      icon: <FaNetworkWired size={13} />,
      content: <SubareasPanel />,
    },
    {
      id: "tiposDispositivo",
      label: t("tabs.tiposDispositivo"),
      icon: <FaMicrochip size={13} />,
      content: <TiposDispositivoTab />,
    },
    {
      id: "tiposDocumento",
      label: t("tabs.tiposDocumento"),
      icon: <FaFileAlt size={13} />,
      content: <TiposDocumentoTab />,
    },
    {
      id: "generos",
      label: t("tabs.generos"),
      icon: <FaVenusMars size={13} />,
      content: <GenerosTab />,
    },
    {
      id: "tiposSangre",
      label: t("tabs.tiposSangre"),
      icon: <FaTint size={13} />,
      content: <TiposSangreTab />,
    },
    {
      id: "notificaciones",
      label: t("tabs.notificaciones"),
      icon: <FaEnvelope size={13} />,
      content: <SysConfigTab />,
    },
  ];

  return <ITTabs items={items} variant="line" />;
}