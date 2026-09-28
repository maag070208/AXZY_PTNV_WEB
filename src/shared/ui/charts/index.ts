export { default as DonutChart } from "./DonutChart";
export { default as HBarChart } from "./HBarChart";
export { default as StackedBar } from "./StackedBar";

/**
 * Colores de estado de las gráficas (validados para daltonismo y contraste en
 * este orden): bien, informativo, atención, crítico.
 */
export const CHART_STATUS = {
  good: "#059669",
  info: "#2563eb",
  warning: "#d97706",
  critical: "#e11d48",
} as const;
