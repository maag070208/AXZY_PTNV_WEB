import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import type { WeeklyWriteoffReport } from "@entities/hotel-linen";
import WriteoffWeeklyPdf from "../ui/WriteoffWeeklyPdf";

/** Genera el PDF del reporte semanal de bajas como blob. */
export const buildWriteoffWeeklyPdf = async (report: WeeklyWriteoffReport): Promise<Blob> =>
  pdf(createElement(WriteoffWeeklyPdf, { report }) as any).toBlob();

/** Genera y descarga el PDF (`bajas-blancos-AAAA-MM-DD.pdf`). */
export const downloadWriteoffWeeklyPdf = async (report: WeeklyWriteoffReport): Promise<void> => {
  const blob = await buildWriteoffWeeklyPdf(report);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bajas-blancos-${report.from.slice(0, 10)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
