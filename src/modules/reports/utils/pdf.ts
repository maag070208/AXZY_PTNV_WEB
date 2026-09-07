import { saveAs } from "file-saver";
import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import type { ReportFilters, ReportRow, AsignadoRow, DeviceReportRow } from "@core/api/reports.api";
import ReportPDF from "../components/ReportPDF";
import AsignadosPDF from "../components/AsignadosPDF";
import DevicePDF from "../components/DevicePDF";

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

export const downloadAsignadosPDF = async (rows: AsignadoRow[]): Promise<void> => {
  const blob = await pdf(createElement(AsignadosPDF, { rows }) as any).toBlob();
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = now.getFullYear();
  saveAs(blob, `reporte_asignados_${yy}${mm}${dd}.pdf`);
};

export const downloadDevicesPDF = async (rows: DeviceReportRow[]): Promise<void> => {
  const blob = await pdf(createElement(DevicePDF, { rows }) as any).toBlob();
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = now.getFullYear();
  saveAs(blob, `reporte_dispositivos_${yy}${mm}${dd}.pdf`);
};
