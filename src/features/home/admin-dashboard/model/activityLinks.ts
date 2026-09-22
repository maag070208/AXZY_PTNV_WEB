import type { DashboardActivity } from "@entities/dashboard";

// Resuelve a dónde navega una entrada del feed de actividad reciente. Devuelve
// `null` cuando el scope no tiene ruta de detalle o faltan los ids necesarios.
export const activityHref = (a: DashboardActivity): string | null => {
  switch (a.scope) {
    case "tickets":
      return a.targetId ? `/tickets/${a.targetId}` : null;
    case "cartas":
      return a.targetId ? `/inventario/prestamos/${a.targetId}` : null;
    case "inventory":
      return a.deviceId ? `/inventario/dispositivos/${a.deviceId}` : null;
    case "salidas":
    case "devices":
      return null;
    default:
      return null;
  }
};