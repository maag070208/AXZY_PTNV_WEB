import { ITGrid } from "@axzydev/axzy_ui_system";
import { FaCheckCircle, FaLayerGroup, FaMicrochip, FaMoon } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { StatCard } from "@shared/ui/stat-card";
import type { DeviceTypesStats } from "../model/useDeviceTypesList";

export default function DeviceTypeStatsGrid({ stats }: { stats: DeviceTypesStats }) {
  const { t } = useTranslation(["device-types"]);

  const d = (n: number) => (stats.loading ? "–" : String(n));
  const value = stats.loading ? "–" : String(stats.types);

  return (
    <ITGrid container columns={12} spacing={3}>
      <ITGrid item xs={6} md={3}>
        <StatCard
          icon={<FaLayerGroup size={14} className="text-white" />}
          circleClass="bg-gradient-to-br from-emerald-500 to-emerald-600"
          value={value}
          label={t("list.statsTypes")}
        />
      </ITGrid>
      <ITGrid item xs={6} md={3}>
        <StatCard
          icon={<FaCheckCircle size={14} className="text-white" />}
          circleClass="bg-gradient-to-br from-teal-500 to-teal-600"
          value={d(stats.active)}
          label={t("list.statsActive")}
        />
      </ITGrid>
      <ITGrid item xs={6} md={3}>
        <StatCard
          icon={<FaMoon size={14} className="text-white" />}
          circleClass="bg-gradient-to-br from-slate-400 to-slate-500"
          value={d(stats.inactive)}
          label={t("list.statsInactive")}
        />
      </ITGrid>
      <ITGrid item xs={6} md={3}>
        <StatCard
          icon={<FaMicrochip size={14} className="text-white" />}
          circleClass="bg-gradient-to-br from-indigo-500 to-indigo-600"
          value={d(stats.devices)}
          label={t("list.statsDevices")}
        />
      </ITGrid>
    </ITGrid>
  );
}