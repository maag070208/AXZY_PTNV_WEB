import { ITChip } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import type { AmenityControlStatus } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";

const COLOR: Record<AmenityControlStatus, "gray" | "info" | "primary" | "success"> = {
  DRAFT: "gray",
  SUBMITTED: "info",
  REVIEWED: "primary",
  ACKNOWLEDGED: "success",
};

export default function AmenityStatusChip({ status }: { status: AmenityControlStatus }) {
  const { t } = useTranslation("hotel-linen-amenity");
  return <ITChip size="sm" color={COLOR[status]} label={dyn(t)(`status.${status}`)} />;
}
