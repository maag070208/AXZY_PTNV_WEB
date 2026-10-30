import { ITPage } from "@axzydev/axzy_ui_system";
import { FaExclamationTriangle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import InventoryMismatchesBoard from "@features/inventory/audit/ui/InventoryMismatchesBoard";
import { useGoBack } from "@shared/lib/useGoBack";

/** Descuadres del inventario: los movimientos cuya cantidad no cuadra con sus piezas. */
export default function InventoryMismatchesPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("audit.resolveScreen")}
      description={t("audit.resolveScreenHint")}
      icon={<FaExclamationTriangle size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.inventory"), onClick: () => navigate("/inventory") },
        { label: t("audit.resolveScreen") },
      ]}
      backAction={() => goBack("/inventory")}
    >
      <InventoryMismatchesBoard />
    </ITPage>
  );
}
