import { ITTabs } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import ConditionTab from "./ConditionTab";
import KardexTab from "./KardexTab";
import LaundryTab from "./LaundryTab";
import LifeTab from "./LifeTab";
import ParTab from "./ParTab";
import ReconciliationTab from "./ReconciliationTab";
import ShrinkageTab from "./ShrinkageTab";
import type { ExportPdf } from "./common";

/** Pestañas de reportes de blancos; cada una exporta PDF y CSV. */
export default function ReportsPanel({ exportPdf }: { exportPdf: ExportPdf }) {
  const { t } = useTranslation("hotel-linen-report");
  return (
    <ITTabs
      variant="line"
      items={[
        { id: "par", label: t("tabs.par"), content: <ParTab exportPdf={exportPdf} /> },
        { id: "condition", label: t("tabs.condition"), content: <ConditionTab exportPdf={exportPdf} /> },
        { id: "shrinkage", label: t("tabs.shrinkage"), content: <ShrinkageTab exportPdf={exportPdf} /> },
        { id: "laundry", label: t("tabs.laundry"), content: <LaundryTab exportPdf={exportPdf} /> },
        { id: "life", label: t("tabs.life"), content: <LifeTab exportPdf={exportPdf} /> },
        { id: "areaReconciliation", label: t("tabs.areaReconciliation"), content: <ReconciliationTab exportPdf={exportPdf} /> },
        { id: "kardex", label: t("tabs.kardex"), content: <KardexTab exportPdf={exportPdf} /> },
      ]}
    />
  );
}
