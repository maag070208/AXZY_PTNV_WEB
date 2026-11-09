import { ITChip } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import type { WriteoffStatus } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";

const COLOR: Record<WriteoffStatus, "warning" | "success" | "gray"> = {
  PENDING_APPROVAL: "warning",
  ACTIVE: "success",
  CANCELLED: "gray",
};

export default function WriteoffStatusChip({ status }: { status: WriteoffStatus }) {
  const { t } = useTranslation("hotel-linen-writeoff");
  return <ITChip size="sm" color={COLOR[status]} label={dyn(t)(`writeoffs.status.${status}`)} />;
}
