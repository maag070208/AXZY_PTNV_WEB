import { ITChip } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import type { HotelTransferStatus } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";

const COLOR: Record<HotelTransferStatus, "info" | "success" | "warning" | "gray"> = {
  IN_TRANSIT: "info",
  ACTIVE: "success",
  RECEIVED_WITH_DIFFERENCE: "warning",
  CANCELLED: "gray",
};

export default function TransferStatusChip({ status }: { status: HotelTransferStatus }) {
  const { t } = useTranslation("hotel-linen");
  return <ITChip size="sm" color={COLOR[status]} label={dyn(t)(`transfers.status.${status}`)} />;
}
