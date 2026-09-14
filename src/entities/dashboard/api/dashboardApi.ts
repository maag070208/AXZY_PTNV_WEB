import { api } from "@shared/api/client";
import type { DashboardSummary } from "../model/types";

export const dashboardApi = {
  getSummary: () => api.get<DashboardSummary>(`/dashboard/summary`),
};
