import i18n from "@shared/i18n";

export const formatLocation = (loc?: { lugar?: string | null } | null): string => {
  const lugar = loc?.lugar?.trim();
  return lugar ? lugar : i18n.t("locations:noName");
};