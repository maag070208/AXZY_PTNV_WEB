import type { HorasExtraPdfMeta, HorasExtraRow, HorasExtraSummary } from "@entities/schedule";

/**
 * Generador del PDF de tiempo extra. Se inyecta por prop desde la página
 * (`@widgets/reports`) para que la feature no dependa de `@widgets/*`.
 */
export type DownloadOvertimePdf = (
  rows: HorasExtraRow[],
  summary: HorasExtraSummary,
  meta: HorasExtraPdfMeta
) => Promise<void>;
