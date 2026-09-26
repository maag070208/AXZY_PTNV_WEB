import type { DashboardActivity } from "@entities/dashboard";

// Resuelve a dónde navega una entrada del feed de actividad reciente. Devuelve
// `null` cuando el scope no tiene ruta de detalle o faltan los ids necesarios.
export const activityHref = (a: DashboardActivity): string | null => {
  switch (a.scope) {
    case "tickets":
      return a.targetId ? `/tickets/${a.targetId}` : null;
    case "custodyLetters":
      return a.targetId ? `/inventory/loans/${a.targetId}` : null;
    case "inventory":
      return a.deviceId ? `/inventory/devices/${a.deviceId}` : null;
    case "materialOutputs":
    case "devices":
      return null;
    default:
      return null;
  }
};