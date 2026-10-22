import { TimeClockTab, useTimeClock } from "@features/access/time-clock";

/** Checadas del reloj (entradas, salidas y reporte). */
export default function CheckinsTab() {
  const fx = useTimeClock();
  return <TimeClockTab fx={fx} />;
}
