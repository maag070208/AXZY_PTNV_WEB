import type { ReactNode } from "react";
import { usePermissions, useCurrentRole } from "@entities/user";
import AccessTodayWidget from "./widgets/AccessTodayWidget";
import AttendanceTodayWidget from "./widgets/AttendanceTodayWidget";
import MyEquipmentWidget from "./widgets/MyEquipmentWidget";
import OvertimeWeekWidget from "./widgets/OvertimeWeekWidget";
import PeopleWidget from "./widgets/PeopleWidget";
import RecordsChartsWidget from "./widgets/RecordsChartsWidget";
import SetupGapsWidget from "./widgets/SetupGapsWidget";
import SystemHealthWidget from "./widgets/SystemHealthWidget";
import TasksWidget from "./widgets/TasksWidget";
import TicketsWidget from "./widgets/TicketsWidget";
import KitchenWidget from "./widgets/KitchenWidget";

export type WidgetId =
  | "systemHealth"
  | "operations"
  | "attendanceToday"
  | "hrRecords"
  | "recordsCharts"
  | "people"
  | "overtimeWeek"
  | "setupGaps"
  | "tickets"
  | "tasks"
  | "myEquipment"
  | "accessToday"
  | "kitchen";

/**
 * Catálogo de widgets: qué permiso pide cada uno (la API vuelve a validarlo y
 * recorta con el alcance). `null` = solo sesión (datos propios).
 */
const WIDGETS: Record<WidgetId, { permission: string | null; render?: () => ReactNode }> = {
  systemHealth: { permission: "system.configure", render: () => <SystemHealthWidget /> },
  operations: { permission: "dashboard.view" },
  attendanceToday: { permission: "attendance.view", render: () => <AttendanceTodayWidget /> },
  // El tablero de expedientes lo arma la página (vive en `features/hr`).
  hrRecords: { permission: "hr.records" },
  recordsCharts: { permission: "hr.records", render: () => <RecordsChartsWidget /> },
  people: { permission: "hr.records", render: () => <PeopleWidget /> },
  overtimeWeek: { permission: "overtime.view", render: () => <OvertimeWeekWidget /> },
  setupGaps: { permission: "time_clock.link", render: () => <SetupGapsWidget /> },
  tickets: { permission: "tickets.view", render: () => <TicketsWidget /> },
  tasks: { permission: "tasks.view", render: () => <TasksWidget /> },
  myEquipment: { permission: null, render: () => <MyEquipmentWidget /> },
  accessToday: { permission: "access.scan", render: () => <AccessTodayWidget /> },
  kitchen: { permission: "kitchen.view", render: () => <KitchenWidget /> },
};

/**
 * Acomodo por rol: qué va primero para cada quien. Si a un rol le dan más
 * permisos (o es un rol nuevo), sus widgets extra aparecen después, en el
 * orden de `DEFAULT_ORDER`: el tablero lo deciden los permisos, no el rol.
 */
const ROLE_LAYOUTS: Record<string, WidgetId[]> = {
  // El admin conserva su tablero de siempre arriba; lo nuevo va debajo.
  ADMIN: ["operations", "systemHealth", "attendanceToday", "overtimeWeek", "tickets", "setupGaps"],
  MANAGER: ["attendanceToday", "overtimeWeek", "tickets", "tasks", "operations"],
  HUMAN_RESOURCES: ["hrRecords", "recordsCharts", "attendanceToday", "people", "overtimeWeek", "setupGaps"],
  AREA_HEAD: ["tickets", "tasks", "attendanceToday", "myEquipment"],
  EMPLOYEE: ["attendanceToday", "tickets", "tasks", "myEquipment"],
  CHEF: ["kitchen", "tickets", "tasks", "attendanceToday"],
  GUARD: ["accessToday", "tickets", "myEquipment"],
};

const DEFAULT_ORDER: WidgetId[] = [
  "attendanceToday",
  "hrRecords",
  "recordsCharts",
  "tickets",
  "tasks",
  "overtimeWeek",
  "people",
  "accessToday",
  "setupGaps",
  "systemHealth",
  "operations",
  "kitchen",
];

interface Props {
  /** Widgets que arma la página (p. ej. `operations` = el tablero de operación actual). */
  slots?: Partial<Record<WidgetId, ReactNode>>;
}

/** Tablero de inicio según el rol y los permisos de la sesión. */
export default function RoleDashboard({ slots = {} }: Props) {
  const permissions = usePermissions();
  const role = useCurrentRole();
  const allowed = (id: WidgetId) => {
    const permission = WIDGETS[id].permission;
    return (permission === null || (permissions[permission] ?? "NONE") !== "NONE") && (!!WIDGETS[id].render || !!slots[id]);
  };
  const layout = ROLE_LAYOUTS[role ?? ""] ?? [];
  const ids = [...layout, ...DEFAULT_ORDER.filter((id) => !layout.includes(id))].filter(allowed);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {ids.map((id) =>
        slots[id] ? (
          <div key={id} className="lg:col-span-2">
            {slots[id]}
          </div>
        ) : (
          <div key={id} className="contents">
            {WIDGETS[id].render!()}
          </div>
        )
      )}
    </div>
  );
}
