import { saveAs } from "file-saver";
import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import type { ReportFilters, ReportRow } from "@core/api/reports.api";
import ReportPDF from "../components/ReportPDF";

export const downloadReportPDF = async (
  rows: ReportRow[],
  filters?: ReportFilters
): Promise<void> => {
  const blob = await pdf(
    createElement(ReportPDF, { rows, filters }) as any
  ).toBlob();
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = now.getFullYear();
  saveAs(blob, `reporte_entregas_${yy}${mm}${dd}.pdf`);
};
