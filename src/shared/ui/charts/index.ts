export { default as DonutChart } from "./DonutChart";
export { default as GaugeArc } from "./GaugeArc";
export { default as HBarChart } from "./HBarChart";
export { default as Sparkline } from "./Sparkline";
export { default as StackedBar } from "./StackedBar";
export { default as WaveFill } from "./WaveFill";

/**
 * Colores de estado de las gráficas (validados para daltonismo y contraste en
 * este orden): bien, informativo, atención, crítico.
 */
export const CHART_STATUS = {
  good: "var(--color-success)",
  info: "var(--color-secondary)",
  warning: "var(--color-warning)",
  critical: "var(--color-danger)",
} as const;
