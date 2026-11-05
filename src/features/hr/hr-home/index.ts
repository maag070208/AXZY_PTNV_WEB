// API pública de la feature "Inicio de RH". La página compone las secciones y
// le inyecta el generador de PDF (DI) desde @widgets/reports.
export { default as HrPendingToday } from "./ui/HrPendingToday";
export { default as HrQuickActions, type HrQuickAction } from "./ui/HrQuickActions";
export { default as HrWeeklyClose } from "./ui/HrWeeklyClose";
export { default as HrReviewDialog } from "./ui/HrReviewDialog";
export { default as HrReports } from "./ui/HrReports";
export { useHrHome, type UseHrHome } from "./model/useHrHome";
