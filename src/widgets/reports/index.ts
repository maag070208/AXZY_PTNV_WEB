// API pública del widget "reports". Provee los generadores PDF; los tabs viven
// en @features/report y reciben el download por DI desde la página.
export { default as ReportPDF } from "./ui/ReportPDF";
export { default as DevicePDF } from "./ui/DevicePDF";
export { default as AssignedDevicesPdf } from "./ui/AssignedDevicesPdf";
export { default as MaterialOutputsPdf } from "./ui/MaterialOutputsPdf";
export { default as AccessReportPDF } from "./ui/AccessReportPDF";
export { default as OvertimePDF } from "./ui/OvertimePDF";
export {
  downloadReportPDF,
  downloadAssignedDevicesPdf,
  downloadDevicesPDF,
  downloadMaterialOutputsPdf,
  downloadAccessReportPDF,
  downloadTimeClockReportPdf,
  downloadOvertimePDF,
} from "./model/pdf";