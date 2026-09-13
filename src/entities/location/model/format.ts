import i18n from "@shared/i18n";
import type { Location } from "./types";

export const formatLocation = (loc?: Location | null): string => {
  const lugar = loc?.lugar?.trim();
  return lugar ? lugar : i18n.t("locations:noName");
};