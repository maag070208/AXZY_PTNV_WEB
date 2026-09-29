import { ITButton } from "@axzydev/axzy_ui_system";
import { FaSave } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface Props {
  articles: number;
  units: number;
  totalCost: number;
  saving: boolean;
  disabled: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

/** Pie fijo con el resumen y las acciones (cancelar / registrar). */
export default function StockInFooter({
  articles,
  units,
  totalCost,
  saving,
  disabled,
  onCancel,
  onSubmit,
}: Props) {
  const { t } = useTranslation("kitchen");
  const formattedCost = totalCost.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/80 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {t("stockIn.summary")}
            </span>
            <span className="text-xs font-medium text-slate-700">
              {t("stockIn.footerSummary", { articles, units })}
            </span>
          </div>
          {totalCost > 0 && (
            <div className="hidden border-l border-slate-200 pl-4 sm:flex sm:flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {t("stockIn.totalCost")}
              </span>
              <span className="text-sm font-bold text-slate-900">${formattedCost}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ITButton
            variant="outlined"
            color="gray"
            disabled={saving}
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold"
          >
            {t("common.cancel")}
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            disabled={disabled || saving}
            onClick={onSubmit}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold shadow-sm"
          >
            <FaSave size={12} />
            <span>{saving ? t("stockIn.saving") : t("stockIn.submit")}</span>
          </ITButton>
        </div>
      </div>
    </div>
  );
}
