import { api } from "@shared/api/client";
import type {
  ConditionReport,
  KardexReport,
  LaundryReport,
  LinenDashboard,
  ParReport,
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
  kardex: (productId: string, from?: string, to?: string, warehouseId?: string) => {
    const q = range(from, to);
    q.set("productId", productId);
    if (warehouseId) q.set("warehouseId", warehouseId);
    return api.get<KardexReport>(`${BASE}/reports/kardex?${q}`);
  },
};
