import type { KpiTone } from "@shared/ui/kpi-tile";

/** Tono de alarma: el color solo si hay algo que atender; en cero, neutral. */
export const alarmTone = (count: number, tone: KpiTone): KpiTone => (count > 0 ? tone : "neutral");
