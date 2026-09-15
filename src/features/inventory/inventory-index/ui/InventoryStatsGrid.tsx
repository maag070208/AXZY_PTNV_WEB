import { ITGrid } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaBoxes, FaWarehouse } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { StatCard } from "@shared/ui/stat-card";
import type { UseInventoryIndex } from "../model/useInventoryIndex";

export default function InventoryStatsGrid({ fx }: { fx: UseInventoryIndex }) {
  const { t } = useTranslation(["inventory"]);
  const unassigned = fx.unassignedDevices.length ?? 0;

  return (
    <ITGrid container columns={12} spacing={4}>
      <ITGrid item xs={12} sm={6} md={4}>
        <StatCard
          size="lg"
          icon={<FaBoxes size={20} className="text-white" />}
          circleClass="bg-blue-500"
          value={fx.summary?.stats.totalDevices ?? 0}
          label={t("index.totalDevices")}
        />
      </ITGrid>
      <ITGrid item xs={12} sm={6} md={4}>
        <StatCard
          size="lg"
          icon={<FaWarehouse size={20} className="text-white" />}
          circleClass="bg-emerald-500"
          value={fx.summary?.stats.departmentDevices ?? 0}
          label={t("index.departmentDevices")}
        />
      </ITGrid>
      <ITGrid item xs={12} sm={6} md={4}>
        <StatCard
          size="lg"
          icon={<FaBoxOpen size={20} className="text-white" />}
          circleClass={unassigned > 0 ? "bg-amber-500" : "bg-slate-300"}
          value={unassigned}
          label={t("index.unassignedDevices")}
        />
      </ITGrid>
    </ITGrid>
  );
}