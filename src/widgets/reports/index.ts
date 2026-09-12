// API pública del widget "reports". Nada fuera de esta carpeta debe importar
// directo desde model/ o ui/ — todo pasa por este barrel.
export { default as ReportPDF } from "./ui/ReportPDF";
export { default as DevicePDF } from "./ui/DevicePDF";
export { default as AsignadosPDF } from "./ui/AsignadosPDF";
export { default as AsignadosTab } from "./ui/AsignadosTab";
export { default as DevicesTab } from "./ui/DevicesTab";
export {
  downloadReportPDF,
  downloadAsignadosPDF,
  downloadDevicesPDF,
} from "./model/pdf";