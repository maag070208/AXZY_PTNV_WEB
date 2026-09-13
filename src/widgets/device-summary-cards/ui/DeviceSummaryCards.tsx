import { ITGrid } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaCheckCircle, FaLock, FaTimesCircle } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { StatCard } from "@shared/ui/stat-card";
import type { DeviceSummary } from "@entities/device";

interface DeviceSummaryCardsProps {
  summary: DeviceSummary | null;
  onToggleEstado: (estado: string) => void;
}

export default function DeviceSummaryCards({ summary, onToggleEstado }: DeviceSummaryCardsProps) {
  const { t } = useTranslation("device");

  return (
    <ITGrid container columns={12} spacing={3} className="mb-4">
      <ITGrid item xs={6} md={3}>
        <StatCard
          size="sm"
          icon={<FaBoxOpen size={14} className="text-slate-600" />}
          circleClass="bg-slate-100"
          value={summary?.total ?? "–"}
          label={t("summary.total")}
          className="border border-slate-200"
        />
      </ITGrid>
      <ITGrid item xs={6} md={3}>
        <StatCard
          size="sm"
          icon={<FaCheckCircle size={14} className="text-emerald-600" />}
          circleClass="bg-emerald-50"
          value={summary?.disponible ?? "–"}
          label={t("summary.available")}
          className="border border-slate-200 cursor-pointer hover:border-emerald-300"
          onClick={() => onToggleEstado("DISPONIBLE")}
        />
      </ITGrid>
      <ITGrid item xs={6} md={3}>
        <StatCard
          size="sm"
          icon={<FaLock size={14} className="text-amber-600" />}
          circleClass="bg-amber-50"
          value={summary?.asignado ?? "–"}
          label={t("summary.assigned")}
          className="border border-slate-200 cursor-pointer hover:border-amber-300"
          onClick={() => onToggleEstado("ASIGNADO")}
        />
      </ITGrid>
      <ITGrid item xs={6} md={3}>
        <StatCard
          size="sm"
          icon={<FaTimesCircle size={14} className="text-slate-500" />}
          circleClass="bg-slate-100"
          value={summary?.baja ?? "–"}
          label={t("summary.decommissioned")}
          className="border border-slate-200 cursor-pointer hover:border-slate-400"
          onClick={() => onToggleEstado("BAJA")}
        />
      </ITGrid>
    </ITGrid>
  );
}