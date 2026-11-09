import { ITChip } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import type { SupplyRequestStatus } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";

const COLOR: Record<SupplyRequestStatus, "gray" | "info" | "warning" | "success" | "primary"> = {
  DRAFT: "gray",
  SUBMITTED: "info",
  PARTIALLY_FULFILLED: "warning",
  FULFILLED: "primary",
  RECEIVED: "success",
  CANCELLED: "gray",
};

export default function SupplyStatusChip({ status }: { status: SupplyRequestStatus }) {
  const { t } = useTranslation("hotel-linen-laundry");
  return <ITChip size="sm" color={COLOR[status]} label={dyn(t)(`requests.status.${status}`)} />;
}
