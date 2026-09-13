import { ITButton, ITCard, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import {
  FaBoxOpen,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileExcel,
  FaLaptop,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { StatCard } from "@shared/ui/stat-card";
import type { UseDeviceImport } from "../model/useDeviceImport";

export default function ImportResultsCard({ fx }: { fx: UseDeviceImport }) {
  const { t: tt } = useTranslation(["device"]);
  if (!fx.results) return null;
  const ok = fx.results.filter((r) => r.ok).length;
  const err = fx.results.length - ok;
  return (
    <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px] mt-6">
      <ITFlex align="center" gap={2} className="mb-4">
        <FaCheckCircle size={14} className="text-emerald-600" />
        <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
          {tt("import.resultsTitle")}
        </ITText>
      </ITFlex>

      <ITGrid container columns={12} spacing={3} className="mb-4">
        <ITGrid item xs={6}>
          <StatCard
            icon={<FaCheckCircle size={14} className="text-white" />}
            circleClass="bg-gradient-to-br from-emerald-500 to-emerald-600"
            value={ok}
            label={tt("import.resultsOk", { count: ok })}
          />
        </ITGrid>
        <ITGrid item xs={6}>
          <StatCard
            icon={<FaExclamationTriangle size={14} className="text-white" />}
            circleClass="bg-gradient-to-br from-amber-500 to-amber-600"
            value={err}
            label={tt("import.resultsError", { count: err })}
          />
        </ITGrid>
      </ITGrid>

      <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-100">
        {fx.results.map((r, i) => (
          <ITFlex
            key={i}
            justify="between"
            align="center"
            className="px-3 py-2 border-b border-slate-100 last:border-b-0"
          >
            <ITFlex align="center" gap={2}>
              {r.ok ? (
                <FaCheckCircle size={11} className="text-emerald-600" />
              ) : (
                <FaExclamationTriangle size={11} className="text-amber-500" />
              )}
              <ITText className="text-[11px] font-bold text-slate-700">
                {r.modelo}
              </ITText>
            </ITFlex>
            <ITText className="text-[10px] font-bold text-slate-400">
              {r.detail}
            </ITText>
          </ITFlex>
        ))}
      </div>

      <ITFlex justify="end" gap={2} className="mt-5">
        <ITButton variant="outlined" color="secondary" onClick={fx.resetImport}>
          <ITFlex align="center" gap={1}>
            <FaFileExcel size={12} />
            <ITText className="text-[11px] font-bold">{tt("import.uploadAnother")}</ITText>
          </ITFlex>
        </ITButton>
        <ITButton
          variant="outlined"
          color="secondary"
          onClick={() => fx.navigate("/dispositivos/tipos")}
        >
          <ITFlex align="center" gap={1}>
            <FaBoxOpen size={12} />
            <ITText className="text-[11px] font-bold">{tt("import.viewTypes")}</ITText>
          </ITFlex>
        </ITButton>
        <ITButton
          variant="filled"
          color="primary"
          onClick={() => fx.navigate("/dispositivos")}
        >
          <ITFlex align="center" gap={1}>
            <FaLaptop size={12} />
            <ITText className="text-[11px] font-bold">{tt("import.viewDevices")}</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>
    </ITCard>
  );
}