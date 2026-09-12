import { ITCard, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaCheckCircle, FaLock, FaTimesCircle } from "react-icons/fa";
import { useTranslation } from "react-i18next";
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
        <ITCard className="!p-3 border border-slate-200">
          <ITFlex align="center" gap={2}>
            <ITFlex align="center" justify="center" className="w-9 h-9 shrink-0 rounded-xl bg-slate-100 text-slate-600">
              <FaBoxOpen size={14} />
            </ITFlex>
            <ITFlex direction="column" gap={0}>
              <ITText className="text-[18px] font-black text-slate-800 leading-none">{summary?.total ?? "–"}</ITText>
              <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{t("summary.total")}</ITText>
            </ITFlex>
          </ITFlex>
        </ITCard>
      </ITGrid>
      <ITGrid item xs={6} md={3}>
        <ITCard
          className="!p-3 border border-slate-200 cursor-pointer hover:border-emerald-300"
          onClick={() => onToggleEstado("DISPONIBLE")}
        >
          <ITFlex align="center" gap={2}>
            <ITFlex align="center" justify="center" className="w-9 h-9 shrink-0 rounded-xl bg-emerald-50 text-emerald-600">
              <FaCheckCircle size={14} />
            </ITFlex>
            <ITFlex direction="column" gap={0}>
              <ITText className="text-[18px] font-black text-emerald-700 leading-none">{summary?.disponible ?? "–"}</ITText>
              <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{t("summary.available")}</ITText>
            </ITFlex>
          </ITFlex>
        </ITCard>
      </ITGrid>
      <ITGrid item xs={6} md={3}>
        <ITCard
          className="!p-3 border border-slate-200 cursor-pointer hover:border-amber-300"
          onClick={() => onToggleEstado("ASIGNADO")}
        >
          <ITFlex align="center" gap={2}>
            <ITFlex align="center" justify="center" className="w-9 h-9 shrink-0 rounded-xl bg-amber-50 text-amber-600">
              <FaLock size={14} />
            </ITFlex>
            <ITFlex direction="column" gap={0}>
              <ITText className="text-[18px] font-black text-amber-700 leading-none">{summary?.asignado ?? "–"}</ITText>
              <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{t("summary.assigned")}</ITText>
            </ITFlex>
          </ITFlex>
        </ITCard>
      </ITGrid>
      <ITGrid item xs={6} md={3}>
        <ITCard
          className="!p-3 border border-slate-200 cursor-pointer hover:border-slate-400"
          onClick={() => onToggleEstado("BAJA")}
        >
          <ITFlex align="center" gap={2}>
            <ITFlex align="center" justify="center" className="w-9 h-9 shrink-0 rounded-xl bg-slate-100 text-slate-500">
              <FaTimesCircle size={14} />
            </ITFlex>
            <ITFlex direction="column" gap={0}>
              <ITText className="text-[18px] font-black text-slate-600 leading-none">{summary?.baja ?? "–"}</ITText>
              <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{t("summary.decommissioned")}</ITText>
            </ITFlex>
          </ITFlex>
        </ITCard>
      </ITGrid>
    </ITGrid>
  );
}
