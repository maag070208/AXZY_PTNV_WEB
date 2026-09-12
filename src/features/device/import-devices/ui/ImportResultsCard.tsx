import { ITBadget, ITButton, ITCard, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaCheckCircle, FaExclamationTriangle, FaLaptop } from "react-icons/fa";
import type { UseDeviceImport } from "../model/useDeviceImport";

export default function ImportResultsCard({ fx }: { fx: UseDeviceImport }) {
  if (!fx.results) return null;
  return (
    <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px] mt-6">
      <ITFlex align="center" gap={2} className="mb-4">
        <FaCheckCircle size={14} className="text-emerald-600" />
        <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
          Resultado de la carga
        </ITText>
      </ITFlex>

      <ITFlex gap={4} wrap="wrap" className="mb-4">
        <ITBadget color="success" size="small">
          {`${fx.results.filter((r) => r.ok).length} procesado(s) correctamente`}
        </ITBadget>
        {fx.results.some((r) => !r.ok) && (
          <ITBadget color="warning" size="small">
            {`${fx.results.filter((r) => !r.ok).length} con error / omitido(s)`}
          </ITBadget>
        )}
      </ITFlex>

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
        <ITButton
          variant="outlined"
          color="secondary"
          onClick={() => fx.navigate("/dispositivos/tipos")}
        >
          <ITFlex align="center" gap={1}>
            <FaBoxOpen size={12} />
            <ITText className="text-[11px] font-bold">Ver tipos</ITText>
          </ITFlex>
        </ITButton>
        <ITButton
          variant="filled"
          color="primary"
          onClick={() => fx.navigate("/dispositivos")}
        >
          <ITFlex align="center" gap={1}>
            <FaLaptop size={12} />
            <ITText className="text-[11px] font-bold">Ver dispositivos</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>
    </ITCard>
  );
}