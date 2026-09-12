// API pública del widget "reports". Provee los generadores PDF; los tabs viven
// en @features/report y reciben el download por DI desde la página.
export { default as ReportPDF } from "./ui/ReportPDF";
export { default as DevicePDF } from "./ui/DevicePDF";
export { default as AsignadosPDF } from "./ui/AsignadosPDF";
export {
  downloadReportPDF,
  downloadAsignadosPDF,
  downloadDevicesPDF,
} from "./model/pdf";