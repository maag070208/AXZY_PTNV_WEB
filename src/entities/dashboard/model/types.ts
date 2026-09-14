export type DashboardActivityScope = "devices" | "tickets" | "cartas" | "salidas" | "inventory";

export interface DashboardActivity {
  id: string;
  scope: DashboardActivityScope;
  message: string;
  at: string;
}

export interface DashboardSummary {
  devices: { total: number; disponible: number; asignado: number; baja: number };
  tickets: { total: number; abierto: number; enSeguimiento: number; cerrado: number };
  cartas: { total: number; activas: number };
  salidas: { total: number; danadas: number };
  departamentos: number;
  empleados: number;
  recentActivity: DashboardActivity[];
}
