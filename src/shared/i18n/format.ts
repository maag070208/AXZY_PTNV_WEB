import i18n from "./config";

const locale = () => (i18n.language?.startsWith("en") ? "en-US" : "es-MX");

export const formatDate = (
  value: string | Date,
  options?: Intl.DateTimeFormatOptions
): string => {
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(locale(), options);
};