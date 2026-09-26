import { ITPage, ITTabs } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaChartBar, FaHandHolding, FaTrashAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  AssignedDevicesTab,
  useAssignedDevicesReport,
} from "@features/report/assigned-devices-tab";
import { DevicesTab, useDevicesReport } from "@features/report/devices-tab";
import { MaterialOutputsTab, useMaterialOutputsReport } from "@features/report/material-outputs-tab";
import {
  downloadAssignedDevicesPdf,
  downloadDevicesPDF,
  downloadMaterialOutputsPdf,
} from "@widgets/reports";

export default function ReportsPage() {
  const { t } = useTranslation(["reports", "common"]);
  const navigate = useNavigate();
  const assignedFx = useAssignedDevicesReport({ download: downloadAssignedDevicesPdf });
  const devicesFx = useDevicesReport({ download: downloadDevicesPDF });
  const materialOutputsFx = useMaterialOutputsReport({ download: downloadMaterialOutputsPdf });

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
            id: "assigned",
            label: t("tabs.assigned"),
            icon: <FaHandHolding size={13} />,
            content: <AssignedDevicesTab fx={assignedFx} />,
          },
          {
            id: "devices",
            label: t("tabs.devices"),
            icon: <FaBoxOpen size={13} />,
            content: <DevicesTab fx={devicesFx} />,
          },
          {
            id: "exits",
            label: t("tabs.exits"),
            icon: <FaTrashAlt size={13} />,
            content: <MaterialOutputsTab fx={materialOutputsFx} />,
          },
        ]}
      />
    </ITPage>
  );
}