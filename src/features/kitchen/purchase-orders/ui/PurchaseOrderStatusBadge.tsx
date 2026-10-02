import { ITBadget } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { purchaseOrderStatusColor, type PurchaseOrderStatus } from "@entities/kitchen";
import { dyn } from "@shared/i18n/dyn";

/** Chip de estado de una orden de compra. */
export default function PurchaseOrderStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  const { t } = useTranslation("kitchen");
  return (
    <ITBadget color={purchaseOrderStatusColor(status)} size="sm">
      {dyn(t)(`purchaseOrders.status.${status}`)}
    </ITBadget>
  );
}
