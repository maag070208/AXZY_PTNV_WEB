import { ITPage, ITTabs } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaChartBar, FaHandHolding, FaTrashAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  AsignadosTab,
  useAsignadosReport,
} from "@features/report/asignados-tab";
import { DevicesTab, useDevicesReport } from "@features/report/devices-tab";
import { SalidasTab, useSalidasReport } from "@features/report/salidas-tab";
import {
  downloadAsignadosPDF,
  downloadDevicesPDF,
  downloadSalidasPDF,
} from "@widgets/reports";

export default function ReportesPage() {
  const { t } = useTranslation(["reports", "common"]);
  const navigate = useNavigate();
  const asignadosFx = useAsignadosReport({ download: downloadAsignadosPDF });
  const devicesFx = useDevicesReport({ download: downloadDevicesPDF });
  const salidasFx = useSalidasReport({ download: downloadSalidasPDF });

  return (
    <ITPage
      title={t("title")}
      description={t("description")}
      backAction={() => navigate(-1)}
      icon={<FaChartBar size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("title") },
      ]}
    >
      <ITTabs
        variant="line"
        items={[
          {
            id: "asignados",
            label: t("tabs.asignados"),
            icon: <FaHandHolding size={13} />,
            content: <AsignadosTab fx={asignadosFx} />,
          },
          {
            id: "dispositivos",
            label: t("tabs.dispositivos"),
            icon: <FaBoxOpen size={13} />,
            content: <DevicesTab fx={devicesFx} />,
          },
          {
            id: "salidas",
            label: t("tabs.salidas"),
            icon: <FaTrashAlt size={13} />,
            content: <SalidasTab fx={salidasFx} />,
          },
        ]}
      />
    </ITPage>
  );
}