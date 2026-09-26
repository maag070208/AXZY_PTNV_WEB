export type DashboardActivityScope = "devices" | "tickets" | "custodyLetters" | "materialOutputs" | "inventory";

export interface DashboardActivity {
  id: string;
  scope: DashboardActivityScope;
  message: string;
  at: string;
  targetId?: string | null;
  deviceId?: string | null;
}

export interface DashboardSummary {
  devices: { total: number; available: number; assigned: number; retirement: number };
  tickets: { total: number; open: number; inProgress: number; closed: number };
  custodyLetters: { total: number; active: number };
  materialOutputs: { total: number; damaged: number };
  departments: number;
  employees: number;
  ticketMetrics: {
    resolvedTasks: number;
    pendingTasks: number;
    avgResolutionDays: number | null;
  };
  ticketEfficiency: {
    user: { id: string; name: string; jobTitle: string | null };
    resolved: number;
    pending: number;
    avgDays: number | null;
  }[];
  urgentTickets: {
    id: string;
    title: string;
    priority: TicketPriority;
    createdAt: string;
    daysOnHold: number;
    assigned: string | null;
  }[];
  recentActivity: DashboardActivity[];
}

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
