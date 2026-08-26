import { api } from "./client";

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId?: string | null;
  userName?: string | null;
  deviceId?: string | null;
  deviceCode?: string | null;
  previousState?: Record<string, any> | null;
  newState?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface AuditLogListResult {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export const auditApi = {
  list: (params?: {
    action?: string;
    entityType?: string;
    userId?: string;
    deviceId?: string;
    start?: string;
    end?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.action) searchParams.set("action", params.action);
    if (params?.entityType) searchParams.set("entityType", params.entityType);
    if (params?.userId) searchParams.set("userId", params.userId);
    if (params?.deviceId) searchParams.set("deviceId", params.deviceId);
    if (params?.start) searchParams.set("start", params.start);
    if (params?.end) searchParams.set("end", params.end);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const qs = searchParams.toString();
    return api.get<AuditLogListResult>(`/audit${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => api.get<AuditLog>(`/audit/${id}`),
};
