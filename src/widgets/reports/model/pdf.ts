import { saveAs } from "file-saver";
import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import { i18n } from "@shared/i18n";
import type { ReportFilters, ReportRow, AssignedDeviceRow, DeviceReportRow } from "@entities/report";
import type { MaterialOutput } from "@entities/material-output";
import type {
  AccessReportPdfMeta,
  AccessReportSessionRow,
  AccessReportSummary,
} from "@entities/access";
import type { OvertimePdfMeta, OvertimeRow, OvertimeSummary } from "@entities/schedule";
import ReportPDF from "../ui/ReportPDF";
import AssignedDevicesPdf from "../ui/AssignedDevicesPdf";
import DevicePDF from "../ui/DevicePDF";
import MaterialOutputsPdf from "../ui/MaterialOutputsPdf";
import AccessReportPDF from "../ui/AccessReportPDF";
import OvertimePDF from "../ui/OvertimePDF";

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

export const downloadAssignedDevicesPdf = async (rows: AssignedDeviceRow[]): Promise<void> => {
  const blob = await pdf(createElement(AssignedDevicesPdf, { rows }) as any).toBlob();
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

export const downloadMaterialOutputsPdf = async (rows: MaterialOutput[]): Promise<void> => {
  const blob = await pdf(createElement(MaterialOutputsPdf, { rows }) as any).toBlob();
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = now.getFullYear();
  saveAs(blob, `reporte_salidas_${yy}${mm}${dd}.pdf`);
};

export const downloadAccessReportPDF = async (
  rows: AccessReportSessionRow[],
  summary: AccessReportSummary,
  meta: AccessReportPdfMeta
): Promise<void> => {
  const blob = await pdf(
    createElement(AccessReportPDF, { rows, summary, meta }) as any
  ).toBlob();
  const stamp = meta.date;
  saveAs(blob, `reporte_accessos_${meta.period}_${stamp}.pdf`);
};

/** Entradas/salidas del reloj checador: mismo PDF que el de accesos, con su título. */
export const downloadTimeClockReportPdf = async (
  rows: AccessReportSessionRow[],
  summary: AccessReportSummary,
  meta: AccessReportPdfMeta
): Promise<void> => {
  const title = i18n.t("time-clock:report.pdfTitle");
  const blob = await pdf(
    createElement(AccessReportPDF, { rows, summary, meta, title }) as any
  ).toBlob();
  saveAs(blob, `reporte_checador_${meta.period}_${meta.date}.pdf`);
};

export const downloadOvertimePDF = async (
  rows: OvertimeRow[],
  summary: OvertimeSummary,
  meta: OvertimePdfMeta
): Promise<void> => {
  const blob = await pdf(
    createElement(OvertimePDF, { rows, summary, meta }) as any
  ).toBlob();
  const stamp = meta.date.replace(/-/g, "");
  saveAs(blob, `reporte_horas_extra_aprobadas_${meta.period.toLowerCase()}_${stamp}.pdf`);
};
