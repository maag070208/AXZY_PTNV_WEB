import { ITChip } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import type { PurchaseHoldStatus, PurchaseOrderStatus, PurchaseRequestStatus } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";

type Color = "gray" | "info" | "warning" | "success" | "primary" | "error";

const ORDER_COLOR: Record<PurchaseOrderStatus, Color> = {
  DRAFT: "gray",
  APPROVED: "info",
  PARTIALLY_RECEIVED: "warning",
  RECEIVED: "success",
  CLOSED: "primary",
  CANCELLED: "gray",
};
const HOLD_COLOR: Record<PurchaseHoldStatus, Color> = { OPEN: "warning", RETURNED: "gray", ACCEPTED: "success" };
const REQUEST_COLOR: Record<PurchaseRequestStatus, Color> = { OPEN: "info", CONVERTED: "success", DISMISSED: "gray" };

export function OrderStatusChip({ status }: { status: PurchaseOrderStatus }) {
  const { t } = useTranslation("hotel-linen-purchase");
  return <ITChip size="sm" color={ORDER_COLOR[status]} label={dyn(t)(`orders.status.${status}`)} />;
}

export function HoldStatusChip({ status }: { status: PurchaseHoldStatus }) {
  const { t } = useTranslation("hotel-linen-purchase");
  return <ITChip size="sm" color={HOLD_COLOR[status]} label={dyn(t)(`holds.status.${status}`)} />;
}

export function RequestStatusChip({ status }: { status: PurchaseRequestStatus }) {
  const { t } = useTranslation("hotel-linen-purchase");
  return <ITChip size="sm" color={REQUEST_COLOR[status]} label={dyn(t)(`requests.status.${status}`)} />;
}
