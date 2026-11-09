import { ITChip } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import type { StocktakeStatus } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";

const COLOR: Record<StocktakeStatus, "gray" | "info" | "warning" | "success"> = {
  DRAFT: "gray",
  COUNTING: "info",
  PENDING_APPROVAL: "warning",
  APPLIED: "success",
  CANCELLED: "gray",
};

export default function CountStatusChip({ status }: { status: StocktakeStatus }) {
  const { t } = useTranslation("hotel-linen-writeoff");
  return <ITChip size="sm" color={COLOR[status]} label={dyn(t)(`counts.status.${status}`)} />;
}
