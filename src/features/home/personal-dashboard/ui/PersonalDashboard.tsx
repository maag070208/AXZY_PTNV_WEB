import type { ReactNode } from "react";
import type { AttendanceTodayWidget, OvertimeWeekWidget } from "@entities/dashboard";
import AttendanceCard from "./AttendanceCard";
import AttentionCard from "./AttentionCard";
import OvertimeCard from "./OvertimeCard";

interface Props {
  /** Datos de los widgets que arma la página (las features no se importan entre sí). */
  attendance: AttendanceTodayWidget | null;
  overtime: OvertimeWeekWidget | null;
  /** Tablero de expedientes que va debajo de las tarjetas. */
  children?: ReactNode;
}

/**
 * Pestaña **Personal** del inicio: tres tarjetas arriba (asistencia de hoy,
 * lo que requiere atención y horas extra de la semana) y debajo el tablero de
 * expedientes que compone la página.
 */
export default function PersonalDashboard({ attendance, overtime, children }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 xl:!flex-row">
        <AttendanceCard attendance={attendance} />
        <AttentionCard attendance={attendance} overtime={overtime} />
        <OvertimeCard overtime={overtime} />
      </div>
      {children}
    </div>
  );
}
