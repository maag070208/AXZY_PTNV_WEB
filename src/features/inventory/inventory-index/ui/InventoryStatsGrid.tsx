import { ITCard, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaBoxes, FaWarehouse } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { UseInventoryIndex } from "../model/useInventoryIndex";

export default function InventoryStatsGrid({ fx }: { fx: UseInventoryIndex }) {
  const { t } = useTranslation(["inventory"]);
  const unlocated = fx.unlocatedDevices.length ?? 0;

  const StatCard = ({
    icon,
    circleClass,
    value,
    label,
  }: {
    icon: React.ReactNode;
    circleClass: string;
    value: number;
    label: string;
  }) => (
    <ITCard className="p-5 h-full flex flex-col items-center justify-center gap-2">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center ${circleClass}`}
      >
        {icon}
      </div>
      <ITText className="text-2xl font-black text-slate-800 leading-none">
        {value}
      </ITText>
      <ITText className="text-[11px] text-slate-500 uppercase tracking-wider text-center">
        {label}
      </ITText>
    </ITCard>
  );

  return (
    <ITGrid container columns={12} spacing={4}>
      <ITGrid item xs={12} sm={6} md={4}>
        <StatCard
          icon={<FaBoxes size={20} className="text-white" />}
          circleClass="bg-blue-500"
          value={fx.summary?.stats.totalDevices ?? 0}
          label={t("index.totalDevices")}
        />
      </ITGrid>
      <ITGrid item xs={12} sm={6} md={4}>
        <StatCard
          icon={<FaWarehouse size={20} className="text-white" />}
          circleClass="bg-emerald-500"
          value={fx.summary?.stats.locatedDevices ?? 0}
          label={t("index.locatedDevices")}
        />
      </ITGrid>
      <ITGrid item xs={12} sm={6} md={4}>
        <StatCard
          icon={<FaBoxOpen size={20} className="text-white" />}
          circleClass={unlocated > 0 ? "bg-amber-500" : "bg-slate-300"}
          value={unlocated}
          label={t("index.unlocatedDevices")}
        />
      </ITGrid>
    </ITGrid>
  );
}