import { saveAs } from "file-saver";
import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import { i18n } from "@shared/i18n";
import type { ReportFilters, ReportRow, AsignadoRow, DeviceReportRow } from "@entities/report";
import type { MaterialOutput } from "@entities/salida";
import type {
  AccessReportPdfMeta,
  AccessReportSessionRow,
  AccessReportSummary,
} from "@entities/access";
import type { HorasExtraPdfMeta, HorasExtraRow, HorasExtraSummary } from "@entities/schedule";
import ReportPDF from "../ui/ReportPDF";
import AsignadosPDF from "../ui/AsignadosPDF";
import DevicePDF from "../ui/DevicePDF";
import SalidasPDF from "../ui/SalidasPDF";
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

export const downloadSalidasPDF = async (rows: MaterialOutput[]): Promise<void> => {
  const blob = await pdf(createElement(SalidasPDF, { rows }) as any).toBlob();
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
export const downloadChecadorReportPDF = async (
  rows: AccessReportSessionRow[],
  summary: AccessReportSummary,
  meta: AccessReportPdfMeta
): Promise<void> => {
  const title = i18n.t("checador:reporte.pdfTitle");
  const blob = await pdf(
    createElement(AccessReportPDF, { rows, summary, meta, title }) as any
  ).toBlob();
  saveAs(blob, `reporte_checador_${meta.period}_${meta.date}.pdf`);
};

export const downloadOvertimePDF = async (
  rows: HorasExtraRow[],
  summary: HorasExtraSummary,
  meta: HorasExtraPdfMeta
): Promise<void> => {
  const blob = await pdf(
    createElement(OvertimePDF, { rows, summary, meta }) as any
  ).toBlob();
  const stamp = meta.date.replace(/-/g, "");
  saveAs(blob, `reporte_horas_extra_${meta.period.toLowerCase()}_${stamp}.pdf`);
};
