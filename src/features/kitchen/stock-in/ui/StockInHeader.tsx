import { FaBoxes, FaLayerGroup } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { KpiTile } from "@shared/ui/kpi-tile";
import { fmtQty } from "@entities/kitchen";

/** Indicadores de la entrada en captura: productos y unidades (estilo Expedientes). */
export default function StockInHeader({ products, units }: { products: number; units: number }) {
  const { t } = useTranslation("kitchen");
  return (
    <div className="grid !grid-cols-2 gap-3">
      <KpiTile label={t("stockIn.products")} value={products} icon={<FaBoxes size={15} />} tone="sky" />
      <KpiTile label={t("stockIn.units")} value={fmtQty(units)} icon={<FaLayerGroup size={15} />} tone="sky" />
    </div>
  );
}
