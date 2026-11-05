import { saveAs } from "file-saver";
import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import { fileName, i18n } from "@shared/i18n";
import type {
  ReportFilters,
  ReportRow,
  AssignedDevicesPdfPayload,
  DevicesPdfPayload,
} from "@entities/report";
import type { MaterialOutputsPdfPayload } from "@entities/material-output";
import type {
  AccessReportPdfMeta,
  AccessReportSessionRow,
  AccessReportSummary,
} from "@entities/access";
import type { OvertimePdfPayload } from "@entities/overtime";
import type { WeeklyAttendancePdfPayload } from "@entities/schedule";
import ReportPDF from "../ui/ReportPDF";
import AssignedDevicesPdf from "../ui/AssignedDevicesPdf";
import DevicePDF from "../ui/DevicePDF";
import MaterialOutputsPdf from "../ui/MaterialOutputsPdf";
import AccessReportPDF from "../ui/AccessReportPDF";
import OvertimePDF from "../ui/OvertimePDF";
import WeeklyAttendancePdf from "../ui/WeeklyAttendancePdf";

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
  saveAs(blob, `${fileName("deliveryReport")}_${yy}${mm}${dd}.pdf`);
};

export const downloadAssignedDevicesPdf = async (
  payload: AssignedDevicesPdfPayload
): Promise<void> => {
  const blob = await pdf(
    createElement(AssignedDevicesPdf, {
      rows: payload.data,
      truncated: payload.truncated,
      appliedFilters: payload.meta.appliedFilters,
    }) as any
  ).toBlob();
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = now.getFullYear();
  saveAs(blob, `${fileName("assignedDevicesReport")}_${yy}${mm}${dd}.pdf`);
};

export const downloadDevicesPDF = async (payload: DevicesPdfPayload): Promise<void> => {
  const blob = await pdf(
    createElement(DevicePDF, {
      rows: payload.data,
      truncated: payload.truncated,
      appliedFilters: payload.meta.appliedFilters,
    }) as any
  ).toBlob();
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = now.getFullYear();
  saveAs(blob, `${fileName("devicesReport")}_${yy}${mm}${dd}.pdf`);
};

export const downloadMaterialOutputsPdf = async (
  payload: MaterialOutputsPdfPayload
): Promise<void> => {
  const blob = await pdf(
    createElement(MaterialOutputsPdf, {
      rows: payload.data,
      appliedFilters: payload.meta.appliedFilters,
    }) as any
  ).toBlob();
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = now.getFullYear();
  saveAs(blob, `${fileName("materialOutputsReport")}_${yy}${mm}${dd}.pdf`);
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
  saveAs(blob, `${fileName("accessReport")}_${meta.period}_${stamp}.pdf`);
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
  saveAs(blob, `${fileName("timeClockReport")}_${meta.period}_${meta.date}.pdf`);
};

export const downloadOvertimePDF = async (payload: OvertimePdfPayload): Promise<void> => {
  const { rows, summary, meta, canApprove } = payload;
  const blob = await pdf(
    createElement(OvertimePDF, { rows, summary, meta, canApprove }) as any
  ).toBlob();
  const stamp = meta.date.replace(/-/g, "");
  saveAs(blob, `${fileName("overtimeReport")}_${meta.period.toLowerCase()}_${stamp}.pdf`);
};

/** Nómina semanal: réplica de la tabla (vista Resumida o Detallada). */
export const downloadWeeklyAttendancePdf = async (
  payload: WeeklyAttendancePdfPayload
): Promise<void> => {
  const { report, mode, rows, meta } = payload;
  const blob = await pdf(
    createElement(WeeklyAttendancePdf, { report, mode, rows, meta }) as any
  ).toBlob();
  saveAs(blob, `${fileName("payroll")}_${report.range.days[0]}.pdf`);
};
