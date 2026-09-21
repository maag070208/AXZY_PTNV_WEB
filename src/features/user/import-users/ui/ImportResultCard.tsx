import { ITBadget, ITButton, ITCard, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { UseUserImport } from "../model/useUserImport";

interface Props {
  fx: UseUserImport;
  onGoToList: () => void;
}

export default function ImportResultCard({ fx, onGoToList }: Props) {
  const { t: tt } = useTranslation("users");
  const result = fx.result;
  if (!result) return null;

  return (
    <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
      <ITFlex align="center" gap={2} className="mb-4">
        <FaCheckCircle size={14} className="text-emerald-600" />
        <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
          Resultado de la carga
        </ITText>
      </ITFlex>

      <ITFlex gap={4} wrap="wrap" className="mb-4">
        <ITBadget color="success" size="lg">
          {tt("import.imported", { count: result.creados })}
        </ITBadget>
        {result.omitidos.length > 0 && (
          <ITBadget color="warning" size="lg">
            {`${result.omitidos.length} omitido(s)`}
          </ITBadget>
        )}
      </ITFlex>

      {result.omitidos.length > 0 && (
        <div className="mt-2">
          <ITFlex align="center" gap={2} className="mb-2">
            <FaExclamationTriangle size={12} className="text-amber-500" />
            <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Filas omitidas
            </ITText>
          </ITFlex>
          {result.omitidos.map((o, i) => (
            <ITText key={i} className="text-[11px] text-slate-500">
              Fila {o.fila} ({o.username}): {o.motivo}
            </ITText>
          ))}
        </div>
      )}

      <ITFlex justify="end" className="mt-5">
        <ITButton variant="filled" color="primary" onClick={onGoToList}>
          {tt("import.goToList")}
        </ITButton>
      </ITFlex>
    </ITCard>
  );
}