import type { Location } from "./types";
import { i18n } from "@shared/i18n";

export const formatLocation = (loc?: Location | null): string => {
  if (!loc) return i18n.t("locations:noLocation");
  const parts = [loc.lugar, loc.subLugar, loc.numero].filter(Boolean);
  return parts.length > 0 ? parts.join("-") : i18n.t("locations:noName");
};