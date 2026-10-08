import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { usePermissions, useCurrentRole } from "@entities/user";
import { TabBar } from "@shared/ui/tab-bar";
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
 * Tema de cada widget. Con muchos widgets (el ADMIN los tiene todos) el inicio
 * se parte en pestañas por tema; el orden de las pestañas lo decide el acomodo
 * del rol, no este catálogo.
 */
export type WidgetGroup = "ops" | "people" | "clock" | "kitchen" | "system" | "mine";

/**
 * Catálogo de widgets: qué permiso pide cada uno (la API vuelve a validarlo y
 * recorta con el alcance) y a qué pestaña pertenece. `null` = solo sesión (datos
 * propios).
 */
const WIDGETS: Record<
  WidgetId,
  { permission: string | null; group: WidgetGroup; render?: () => ReactNode }
> = {
  systemHealth: { permission: "system.configure", group: "system", render: () => <SystemHealthWidget /> },
  operations: { permission: "dashboard.view", group: "ops" },
  attendanceToday: { permission: "attendance.view", group: "people", render: () => <AttendanceTodayWidget /> },
  // El tablero de expedientes lo arma la página (vive en `features/hr`).
  hrRecords: { permission: "hr.records", group: "people" },
  recordsCharts: { permission: "hr.records", group: "people", render: () => <RecordsChartsWidget /> },
  people: { permission: "hr.records", group: "people", render: () => <PeopleWidget /> },
  overtimeWeek: { permission: "overtime.view", group: "people", render: () => <OvertimeWeekWidget /> },
  setupGaps: { permission: "time_clock.link", group: "clock", render: () => <SetupGapsWidget /> },
  tickets: { permission: "tickets.view", group: "ops", render: () => <TicketsWidget /> },
  tasks: { permission: "tasks.view", group: "ops", render: () => <TasksWidget /> },
  myEquipment: { permission: null, group: "mine", render: () => <MyEquipmentWidget /> },
  accessToday: { permission: "access.scan", group: "clock", render: () => <AccessTodayWidget /> },
  kitchen: { permission: "kitchen.view", group: "kitchen", render: () => <KitchenWidget /> },
};

/**
 * Acomodo por rol: qué va primero para cada quien. Si a un rol le dan más
 * permisos (o es un rol nuevo), sus widgets extra aparecen después, en el
 * orden de `DEFAULT_ORDER`: el tablero lo deciden los permisos, no el rol.
 *
 * Con pestañas, este orden también decide en qué lugar va cada pestaña: manda el
 * primer widget de cada tema (por eso al ADMIN le quedan Operación, Personal,
 * Reloj y accesos, Sistema y Cocina, en ese orden).
 */
const ROLE_LAYOUTS: Record<string, WidgetId[]> = {
  // El admin ve todo, pero por temas: el panel en vivo primero.
  ADMIN: ["operations", "attendanceToday", "overtimeWeek", "tickets", "setupGaps", "systemHealth"],
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
  const { t } = useTranslation("home");
  const [grupo, setGrupo] = useState<WidgetGroup | null>(null);

  const allowed = (id: WidgetId) => {
    const permission = WIDGETS[id].permission;
    return (permission === null || (permissions[permission] ?? "NONE") !== "NONE") && (!!WIDGETS[id].render || !!slots[id]);
  };
  const layout = ROLE_LAYOUTS[role ?? ""] ?? [];
  const ids = [...layout, ...DEFAULT_ORDER.filter((id) => !layout.includes(id))].filter(allowed);

  /** Los widgets visibles agrupados por tema, en el orden del acomodo del rol. */
  const grupos: Array<[WidgetGroup, WidgetId[]]> = [];
  for (const id of ids) {
    const tema = WIDGETS[id].group;
    const existente = grupos.find(([clave]) => clave === tema);
    if (existente) existente[1].push(id);
    else grupos.push([tema, [id]]);
  }

  const rejilla = (delGrupo: WidgetId[]) => (
    <div className="grid gap-4 lg:grid-cols-2">
      {delGrupo.map((id) =>
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

  if (grupos.length === 0) return null;
  // Un solo tema: como siempre, sin barra de pestañas (sería un solo botón).
  if (grupos.length === 1) return rejilla(grupos[0][1]);

  const activo = grupo && grupos.some(([clave]) => clave === grupo) ? grupo : grupos[0][0];
  const widgets = grupos.find(([clave]) => clave === activo)?.[1] ?? [];

  return (
    <div className="flex flex-col gap-4">
      <TabBar
        items={grupos.map(([clave]) => ({ id: clave, label: t(`groups.${clave}`) }))}
        value={activo}
        onChange={setGrupo}
      />
      {rejilla(widgets)}
    </div>
  );
}
