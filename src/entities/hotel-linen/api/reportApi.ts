import { api } from "@shared/api/client";
import type {
  AdjustmentReport,
  AdjustmentReportFilters,
  AreaReconciliationReport,
  ConditionReport,
  KardexReport,
  LaundryReport,
  LinenDashboard,
  ParReport,
  GuestLossReport,
  GuestLossReportFilters,
  ShrinkageReport,
} from "../model/reportTypes";

const BASE = "/hotel/linen";
const range = (from?: string, to?: string) => {
  const q = new URLSearchParams();
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  return q;
};

export const reportApi = {
  dashboard: () => api.get<LinenDashboard>(`${BASE}/dashboard`),
  par: (kind?: string) => api.get<ParReport>(`${BASE}/reports/par${kind ? `?kind=${encodeURIComponent(kind)}` : ""}`),
  condition: () => api.get<ConditionReport>(`${BASE}/reports/condition`),
  shrinkage: (from?: string, to?: string) => api.get<ShrinkageReport>(`${BASE}/reports/shrinkage?${range(from, to)}`),
  laundry: (from?: string, to?: string) => api.get<LaundryReport>(`${BASE}/reports/laundry?${range(from, to)}`),
  areaReconciliation: (from?: string, to?: string) => api.get<AreaReconciliationReport>(`${BASE}/reports/area-reconciliation?${range(from, to)}`),
  kardex: (productId: string, from?: string, to?: string, warehouseId?: string) => {
    const q = range(from, to);
    q.set("productId", productId);
    if (warehouseId) q.set("warehouseId", warehouseId);
    return api.get<KardexReport>(`${BASE}/reports/kardex?${q}`);
  },
  adjustments: (filters: AdjustmentReportFilters) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) q.set(k, v);
    return api.get<AdjustmentReport>(`${BASE}/reports/adjustments?${q}`);
  },
  guestLosses: (filters: GuestLossReportFilters) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) q.set(k, v);
    return api.get<GuestLossReport>(`${BASE}/reports/guest-losses?${q}`);
  },
};
