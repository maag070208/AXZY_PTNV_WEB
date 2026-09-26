import type { OvertimePdfMeta, OvertimeRow, OvertimeSummary } from "@entities/schedule";

/**
 * Generador del PDF de tiempo extra. Se inyecta por prop desde la página
 * (`@widgets/reports`) para que la feature no dependa de `@widgets/*`.
 */
export type DownloadOvertimePdf = (
  rows: OvertimeRow[],
  summary: OvertimeSummary,
  meta: OvertimePdfMeta
) => Promise<void>;
