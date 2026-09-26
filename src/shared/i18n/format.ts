import i18n from "./config";

/** Locale de `Intl` para el idioma de la interfaz. */
export const dateLocale = (): string => (i18n.language?.startsWith("en") ? "en-US" : "es-MX");

export const formatDate = (
  value: string | Date,
  options?: Intl.DateTimeFormatOptions
): string => {
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(dateLocale(), options);
};
export type FileNameKey = keyof (typeof import("./locales/es/common.json"))["files"];

/** Prefijo de un archivo descargado (CSV/PDF), en el idioma de la interfaz. */
export const fileName = (key: FileNameKey): string => i18n.t(`common:files.${key}`);
