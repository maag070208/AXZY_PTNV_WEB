import { ITFlex } from "@axzydev/axzy_ui_system";
import { FaWarehouse } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { SummaryBadge } from "@shared/ui/summary-badge";

/** Encabezado de la entrada con el conteo de productos y unidades. */
export default function StockInHeader({ products, units }: { products: number; units: number }) {
  const { t } = useTranslation("kitchen");
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
        <ITFlex align="center" gap={4}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <FaWarehouse size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight text-slate-900">{t("stockIn.headerTitle")}</h1>
            <p className="mt-1 text-sm leading-5 text-slate-500">{t("stockIn.headerDescription")}</p>
          </div>
        </ITFlex>
        <div className="flex items-center gap-2">
          <SummaryBadge label={t("stockIn.products")} value={String(products)} />
          <SummaryBadge label={t("stockIn.units")} value={String(units)} />
        </div>
      </div>
    </div>
  );
}
