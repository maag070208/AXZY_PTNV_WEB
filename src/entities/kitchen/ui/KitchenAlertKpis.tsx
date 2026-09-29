import type { ReactNode } from "react";
import { FaArrowUp, FaExclamationTriangle, FaHourglassHalf, FaCalendarTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { KpiTile, type KpiTone } from "@shared/ui/kpi-tile";
import type { KitchenAlerts } from "../model/types";

export type KitchenAlertKey = "low" | "expiring" | "expired" | "over";

const META: Record<KitchenAlertKey, { icon: ReactNode; tone: KpiTone }> = {
  low: { icon: <FaExclamationTriangle size={15} />, tone: "amber" },
  expiring: { icon: <FaHourglassHalf size={15} />, tone: "orange" },
  expired: { icon: <FaCalendarTimes size={15} />, tone: "rose" },
  over: { icon: <FaArrowUp size={15} />, tone: "sky" },
};

/** Clases completas (Tailwind no genera clases armadas en tiempo de ejecución). */
const COLS: Record<number, string> = { 2: "md:!grid-cols-2", 3: "md:!grid-cols-3", 4: "md:!grid-cols-4" };

interface Props {
  alerts: KitchenAlerts | null;
  /** Qué indicadores mostrar (por defecto los cuatro). */
  keys?: readonly KitchenAlertKey[];
  onSelect?: (key: KitchenAlertKey) => void;
}

/**
 * Indicadores del almacén de cocina: bajo mínimo, por caducar, caducados y
 * sobre stock. En cero quedan en gris con "Todo en orden"; el color solo
 * aparece cuando hay algo que atender.
 */
export default function KitchenAlertKpis({ alerts, keys = ["low", "expiring", "expired", "over"], onSelect }: Props) {
  const { t } = useTranslation("kitchen");
  return (
    <div className={`grid !grid-cols-2 gap-3 ${COLS[Math.min(keys.length, 4)] ?? ""}`}>
      {keys.map((key) => {
        const value = alerts?.counts[key] ?? 0;
        const active = value > 0;
        return (
          <KpiTile
            key={key}
            label={t(`overview.${key}`)}
            value={alerts ? value : "—"}
            icon={META[key].icon}
            tone={active ? META[key].tone : "neutral"}
            hint={active ? t(`overview.hint.${key}`, { days: alerts?.warningDays ?? 3 }) : t("overview.hint.ok")}
            onClick={onSelect ? () => onSelect(key) : undefined}
          />
        );
      })}
    </div>
  );
}
