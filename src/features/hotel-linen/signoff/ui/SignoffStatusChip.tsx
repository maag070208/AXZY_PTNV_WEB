import { ITChip } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import type { SignoffStatus } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";

const COLOR: Record<SignoffStatus, "info" | "success" | "danger"> = {
  PENDING: "info",
  CONFORM: "success",
  DIFFERENCE: "danger",
};

export default function SignoffStatusChip({ status }: { status: SignoffStatus }) {
  const { t } = useTranslation("hotel-linen-signoff");
  return <ITChip size="sm" color={COLOR[status]} label={dyn(t)(`status.${status}`)} />;
}
