import type { Permission, PermissionScope, UserRole } from "@entities/user";

/**
 * Catálogo de pantallas de la app, en el mismo orden que el menú lateral.
 *
 * Es la **fuente única** de verdad: lo consumen `app/guards/PrivateRoutes.tsx`
 * (para armar el menú) y la pestaña "Qué ve cada rol" de `/roles` (para la
 * matriz de visibilidad). Si agregás una pantalla al menú, agregala aquí y
 * ambos lugares la respetan.
 *
 * Cada entrada requiere uno o más permisos (`requirement`) o una regla fija de
 * negocio (`fixedRole`, p. ej. "Mis Tareas" solo para EMPLEADO). Un grupo
 * (con `children`) es visible si lo es al menos uno de sus hijos. Dentro de un
 * grupo, un hijo con `children` es una **sección**: el menú la muestra como
 * encabezado de subítems (ITSidebar no tiene tercer nivel) y no navega.
 */

/** Requisito de visibilidad: cualquiera (`anyOf`) o todas (`allOf`) las claves. */
export type ScreenRequirement =
  | { readonly anyOf: readonly Permission[] }
  | { readonly allOf: readonly Permission[] };

/** Claves del menú en el namespace `common` (para tipar la i18n). */
export type NavLabelKey =
  | "nav.home"
  | "nav.tasks"
  | "nav.tickets"
  | "nav.adminTasks"
  | "nav.myTasks"
  | "nav.inventory"
  | "nav.inventoryOverview"
  | "nav.devices"
  | "nav.movements"
  | "nav.loans"
  | "nav.returns"
  | "nav.reports"
  | "nav.kitchen"
  | "nav.kitchenOverview"
  | "nav.kitchenItems"
  | "nav.kitchenLots"
  | "nav.kitchenMovements"
  | "nav.kitchenStockIn"
  | "nav.kitchenStockOut"
  | "nav.kitchenLedger"
  | "nav.kitchenCount"
  | "nav.kitchenPurchases"
  | "nav.kitchenRestock"
  | "nav.kitchenPurchaseOrders"
  | "nav.kitchenInvoices"
  | "nav.kitchenSuppliers"
  | "nav.kitchenCostCenters"
  | "nav.kitchenCatalog"
  | "nav.access"
  | "nav.accessLog"
  | "nav.accessReport"
  | "nav.accessTimeClock"
  | "nav.accessTimeClockReport"
  | "nav.accessTimeClockEmployees"
  | "nav.clockAttendance"
  | "nav.timeClock"
  | "nav.schedules"
  | "nav.schedulesAdmin"
  | "nav.schedulesAssign"
  | "nav.overtime"
  | "nav.hr"
  | "nav.employees"
  | "nav.hrReports"
  | "nav.employeeRecords"
  | "nav.settings"
  | "nav.catalogs"
  | "nav.users"
  | "nav.clocks"
  | "nav.payroll"
  | "nav.roles";

export interface AppScreen {
  readonly id: string;
  /** Clave i18n en el namespace `common` (p. ej. `nav.tickets`). */
  readonly labelKey: NavLabelKey;
  /** Ruta a la que navega el ítem del menú. */
  readonly path?: string;
  /** Modo de resaltado de la ruta. Por defecto `prefix`. */
  readonly match?: "exact" | "prefix";
  /** Rutas hijas que no deben resaltar este ítem (aunque empiecen igual). */
  readonly excludes?: readonly string[];
  /** Permiso(s) requeridos. Ausente = visible para cualquier sesión. */
  readonly requirement?: ScreenRequirement;
  /** Regla fija: solo este rol la ve, sin importar permisos. */
  readonly fixedRole?: UserRole;
  /**
   * Permisos de las acciones de la pantalla (botones). Si se omite, se derivan
   * del catálogo: los demás permisos del mismo recurso que el requisito
   * (`devices.view` → `devices.create/edit/delete`). Se declaran solo cuando la
   * pantalla usa permisos de otro recurso o no tiene requisito.
   */
  readonly actions?: readonly Permission[];
  readonly children?: readonly AppScreen[];
}

export const APP_SCREENS: readonly AppScreen[] = [
  {
    id: "start",
    labelKey: "nav.home",
    path: "/",
    match: "exact",
  },
  {
    id: "tasks",
    labelKey: "nav.tasks",
    children: [
      { id: "tickets", labelKey: "nav.tickets", path: "/tickets", excludes: ["/tickets/tasks", "/tickets/my-tasks"], actions: ["tickets.create", "tickets.edit", "tickets.close", "tickets.delete"] },
      { id: "adminTasks", labelKey: "nav.adminTasks", path: "/tickets/tasks", requirement: { anyOf: ["tasks.complete"] } },
      { id: "myTasks", labelKey: "nav.myTasks", path: "/tickets/my-tasks", fixedRole: "EMPLOYEE" },
    ],
  },
  {
    id: "inventory",
    labelKey: "nav.inventory",
    children: [
      { id: "inventoryDashboard", labelKey: "nav.inventoryOverview", path: "/inventory", match: "exact", requirement: { anyOf: ["devices.view"] }, actions: ["inventory.audit"] },
      { id: "devices", labelKey: "nav.devices", path: "/inventory/devices", requirement: { anyOf: ["devices.view"] } },
      { id: "reports", labelKey: "nav.reports", path: "/reports", requirement: { anyOf: ["reports.view"] } },
      { id: "movements", labelKey: "nav.movements", path: "/inventory/movements", requirement: { anyOf: ["devices.view"] } },
      { id: "loans", labelKey: "nav.loans", path: "/inventory/loans", requirement: { anyOf: ["loans.view"] } },
      { id: "returns", labelKey: "nav.returns", path: "/inventory/returns", requirement: { anyOf: ["loans.view"] } },
    ],
  },
  {
    id: "kitchen",
    labelKey: "nav.kitchen",
    requirement: { anyOf: ["kitchen.view"] },
    children: [
      { id: "kitchenOverview", labelKey: "nav.kitchenOverview", path: "/kitchen", match: "exact" },
      { id: "kitchenItems", labelKey: "nav.kitchenItems", path: "/kitchen/items", excludes: ["/kitchen/items/new"], requirement: { anyOf: ["kitchen.view"] } },
      { id: "kitchenLots", labelKey: "nav.kitchenLots", path: "/kitchen/lots" },
      // Entradas, salidas/mermas y conteo se abren desde Artículos (botones), no desde el menú.
      { id: "kitchenLedger", labelKey: "nav.kitchenLedger", path: "/kitchen/movements" },
      {
        id: "kitchenPurchases",
        labelKey: "nav.kitchenPurchases",
        children: [
          { id: "kitchenRestock", labelKey: "nav.kitchenRestock", path: "/kitchen/restock" },
          { id: "kitchenPurchaseOrders", labelKey: "nav.kitchenPurchaseOrders", path: "/kitchen/purchase-orders", requirement: { anyOf: ["purchase_orders.view"] } },
          { id: "kitchenCostCenters", labelKey: "nav.kitchenCostCenters", path: "/kitchen/cost-centers", requirement: { anyOf: ["purchase_orders.view"] } },
          { id: "kitchenInvoices", labelKey: "nav.kitchenInvoices", path: "/kitchen/invoices", requirement: { anyOf: ["invoices.view"] } },
          { id: "kitchenSuppliers", labelKey: "nav.kitchenSuppliers", path: "/kitchen/suppliers" },
        ],
      },
      { id: "kitchenCatalog", labelKey: "nav.kitchenCatalog", path: "/kitchen/catalog", requirement: { anyOf: ["kitchen.manage"] }, actions: [] },
    ],
  },
  {
    id: "hr",
    labelKey: "nav.hr",
    children: [
      { id: "employees", labelKey: "nav.employees", path: "/employees", excludes: ["/employees/disciplinary-reports", "/employees/records"], requirement: { anyOf: ["hr.records"] }, actions: ["users.create"] },
      { id: "employeeRecords", labelKey: "nav.employeeRecords", path: "/employees/records", requirement: { anyOf: ["hr.records"] }, actions: [] },
      { id: "hrReports", labelKey: "nav.hrReports", path: "/employees/disciplinary-reports", requirement: { anyOf: ["hr.records"] }, actions: ["hr.disciplinary_reports"] },
      // Asistencias es del RELOJ (las checadas del personal); la bitácora y el
      // reporte de entradas/salidas son del GUARDIA (las puertas). Van en
      // secciones aparte a propósito: con un solo título "Asistencia" no se
      // sabía cuál era cuál.
      {
        id: "clockAttendance",
        labelKey: "nav.clockAttendance",
        children: [
          { id: "accessTimeClockReport", labelKey: "nav.accessTimeClockReport", path: "/hr/time-clock/entries-exits", requirement: { anyOf: ["time_clock.view"] }, actions: [] },
        ],
      },
      {
        id: "access",
        labelKey: "nav.access",
        children: [
          { id: "accessLog", labelKey: "nav.accessLog", path: "/access", excludes: ["/access/report"], requirement: { anyOf: ["access.log"] }, actions: ["access.void"] },
          { id: "accessReport", labelKey: "nav.accessReport", path: "/access/report", requirement: { anyOf: ["access.log"] }, actions: [] },
        ],
      },
      {
        id: "schedules",
        labelKey: "nav.schedules",
        children: [
          { id: "schedulesAdmin", labelKey: "nav.schedulesAdmin", path: "/schedules", match: "exact", requirement: { anyOf: ["schedules.view"] } },
          { id: "schedulesAssign", labelKey: "nav.schedulesAssign", path: "/schedules/assign", requirement: { anyOf: ["schedules.view"] } },
          { id: "overtime", labelKey: "nav.overtime", path: "/schedules/overtime/approval", requirement: { anyOf: ["overtime.view"] } },
          { id: "payroll", labelKey: "nav.payroll", path: "/schedules/payroll", requirement: { anyOf: ["payroll.view"] } },
        ],
      },
    ],
  },
  {
    id: "settings",
    labelKey: "nav.settings",
    children: [
      { id: "catalogs", labelKey: "nav.catalogs", path: "/catalogs", requirement: { anyOf: ["catalogs.manage"] } },
      { id: "users", labelKey: "nav.users", path: "/users", requirement: { anyOf: ["users.view"] } },
      // Todo lo del checador, junto y con su título.
      {
        id: "timeClock",
        labelKey: "nav.timeClock",
        children: [
          { id: "clocks", labelKey: "nav.clocks", path: "/time-clocks", requirement: { anyOf: ["time_clocks.manage"] } },
          { id: "accessTimeClock", labelKey: "nav.accessTimeClock", path: "/hr/time-clock", match: "exact", requirement: { anyOf: ["time_clock.view"] }, actions: ["time_clock.sync"] },
          { id: "accessTimeClockEmployees", labelKey: "nav.accessTimeClockEmployees", path: "/hr/time-clock/employees", requirement: { anyOf: ["time_clock.view"] }, actions: ["time_clock.link"] },
        ],
      },
      { id: "roles", labelKey: "nav.roles", path: "/roles", requirement: { anyOf: ["roles.manage"] } },
    ],
  },
];

/** Mapa clave → alcance tal como lo entrega `/auth/me` (solo los ≠ NONE). */
export type PermissionMap = Partial<Record<Permission, PermissionScope>>;

/** ¿La sesión tiene la clave con cualquier alcance distinto de NONE? */
export const screenHasPermission = (
  permissions: PermissionMap | undefined,
  permission: Permission
): boolean => (permissions?.[permission] ?? "NONE") !== "NONE";

/** Alcance efectivo de una clave para la sesión (NONE si no aplica). */
export const screenScopeOf = (
  permissions: PermissionMap | undefined,
  permission: Permission
): PermissionScope => permissions?.[permission] ?? "NONE";

/**
 * ¿La pantalla es visible para un mapa de permisos y un rol? Respeta el
 * requisito (anyOf/allOf), la regla fija (`fixedRole`) y, en grupos, la
 * visibilidad de sus hijos.
 */
export const isScreenVisible = (
  permissions: PermissionMap | undefined,
  screen: AppScreen,
  role?: string
): boolean => {
  if (screen.fixedRole) return role === screen.fixedRole;
  if (screen.requirement) {
    if ("allOf" in screen.requirement) {
      return screen.requirement.allOf.every((key) => screenHasPermission(permissions, key));
    }
    return screen.requirement.anyOf.some((key) => screenHasPermission(permissions, key));
  }
  if (screen.children?.length) {
    return screen.children.some((child) => isScreenVisible(permissions, child, role));
  }
  return true;
};

/**
 * Visibilidad efectiva de una pantalla **dentro** de su grupo: el grupo debe ser
 * visible y la pantalla también (en el menú real, un hijo oculto por su padre no
 * se muestra aunque tenga el permiso).
 */
export const isScreenVisibleInGroup = (
  permissions: PermissionMap | undefined,
  screen: AppScreen,
  parent: AppScreen | undefined,
  role?: string
): boolean => {
  if (parent && !isScreenVisible(permissions, parent, role)) return false;
  return isScreenVisible(permissions, screen, role);
};

/** Una pantalla "hoja" (sin hijos) con su grupo, para resúmenes y chips. */
export interface ScreenLeaf {
  readonly screen: AppScreen;
  readonly parent?: AppScreen;
}

/** Pantallas hoja del catálogo (en orden), con su grupo si lo tienen. */
export const screenLeaves = (): ScreenLeaf[] => {
  const out: ScreenLeaf[] = [];
  const walk = (screens: readonly AppScreen[], parent?: AppScreen): void => {
    for (const screen of screens) {
      // Una sección hereda el grupo de primer nivel: solo agrupa en el menú.
      if (screen.children?.length) walk(screen.children, parent ?? screen);
      else out.push({ screen, parent });
    }
  };
  walk(APP_SCREENS);
  return out;
};

/** Claves de permiso mencionadas por cualquier pantalla (para separar "acciones"). */
export const referencedPermissions = (): Set<Permission> => {
  const keys = new Set<Permission>();
  const walk = (screens: readonly AppScreen[]): void => {
    for (const screen of screens) {
      if (screen.requirement) {
        const list = "allOf" in screen.requirement ? screen.requirement.allOf : screen.requirement.anyOf;
        for (const key of list) keys.add(key);
      }
      if (screen.children) walk(screen.children);
    }
  };
  walk(APP_SCREENS);
  return keys;
};

/**
 * Permisos de las acciones de una pantalla: los declarados en `actions` o, si
 * no hay, los demás permisos del mismo recurso que su requisito, tomados del
 * catálogo (así un permiso nuevo como `devices.export` aparece solo).
 */
export const screenActions = (screen: AppScreen, catalogKeys: readonly Permission[]): Permission[] => {
  if (screen.actions) return [...screen.actions];
  if (!screen.requirement) return [];
  const required = "allOf" in screen.requirement ? screen.requirement.allOf : screen.requirement.anyOf;
  const resources = new Set(required.map((key) => key.slice(0, key.indexOf("."))));
  return catalogKeys.filter(
    (key) => !required.includes(key) && resources.has(key.slice(0, key.indexOf(".")))
  );
};

/** Permisos que exige ver la pantalla (vacío = cualquier sesión). */
export const screenRequirementKeys = (screen: AppScreen): Permission[] => {
  if (!screen.requirement) return [];
  return [...("allOf" in screen.requirement ? screen.requirement.allOf : screen.requirement.anyOf)];
};
