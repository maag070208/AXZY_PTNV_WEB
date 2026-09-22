export type DashboardActivityScope = "devices" | "tickets" | "cartas" | "salidas" | "inventory";

export interface DashboardActivity {
  id: string;
  scope: DashboardActivityScope;
  message: string;
  at: string;
  targetId?: string | null;
  deviceId?: string | null;
}

export interface DashboardSummary {
  devices: { total: number; disponible: number; asignado: number; baja: number };
  tickets: { total: number; abierto: number; enSeguimiento: number; cerrado: number };
  cartas: { total: number; activas: number };
  salidas: { total: number; danadas: number };
  departamentos: number;
  empleados: number;
  ticketMetricas: {
    tareasResueltas: number;
    tareasPendientes: number;
    avgResolucionDias: number | null;
  };
  ticketEficiencia: {
    user: { id: string; name: string; puesto: string | null };
    resueltas: number;
    pendientes: number;
    avgDias: number | null;
  }[];
  ticketsUrgentes: {
    id: string;
    titulo: string;
    prioridad: TicketPrioridad;
    creadoEn: string;
    diasEnEspera: number;
    asignado: string | null;
  }[];
  recentActivity: DashboardActivity[];
}

export type TicketPrioridad = "BAJA" | "MEDIA" | "ALTA" | "URGENTE";
