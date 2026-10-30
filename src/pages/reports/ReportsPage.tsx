import { useState } from "react";
import { ITPage } from "@axzydev/axzy_ui_system";
import { LuBox, LuChartColumn, LuHandshake, LuTrash2 } from "react-icons/lu";
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
import { useGoBack } from "@shared/lib/useGoBack";
import { TabBar } from "@shared/ui/tab-bar";

type ReportTab = "assigned" | "devices" | "exits";

export default function ReportsPage() {
  const { t } = useTranslation(["reports", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [tab, setTab] = useState<ReportTab>("assigned");
  const assignedFx = useAssignedDevicesReport({ download: downloadAssignedDevicesPdf });
  const devicesFx = useDevicesReport({ download: downloadDevicesPDF });
  const materialOutputsFx = useMaterialOutputsReport({ download: downloadMaterialOutputsPdf });

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      title={t("title")}
      description={t("description")}
      backAction={() => goBack("/")}
      icon={<LuChartColumn size={20} />}
      noPadding
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("title") },
      ]}
    >
      <div className="mb-4">
        <TabBar
          items={[
            { id: "assigned" as ReportTab, label: t("tabs.assigned"), icon: <LuHandshake size={13} /> },
            { id: "devices" as ReportTab, label: t("tabs.devices"), icon: <LuBox size={13} /> },
            { id: "exits" as ReportTab, label: t("tabs.exits"), icon: <LuTrash2 size={13} /> },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      {tab === "assigned" && <AssignedDevicesTab fx={assignedFx} />}
      {tab === "devices" && <DevicesTab fx={devicesFx} />}
      {tab === "exits" && <MaterialOutputsTab fx={materialOutputsFx} />}
    </ITPage>
  );
}
