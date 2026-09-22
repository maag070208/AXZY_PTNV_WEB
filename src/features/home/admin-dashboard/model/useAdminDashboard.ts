import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { dashboardApi, type DashboardActivity, type DashboardSummary } from "@entities/dashboard";
import { useAblyChannel } from "@shared/lib/ably";

const MAX_LIVE_ACTIVITY = 20;
const REFETCH_DEBOUNCE_MS = 800;

export const useAdminDashboard = (enabled: boolean = true) => {
  const { t } = useTranslation(["home", "common"]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [liveActivity, setLiveActivity] = useState<DashboardActivity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(() => {
    if (!enabled) return;
    dashboardApi
      .getSummary()
      .then((data) => {
        setSummary(data);
        setError(null);
      })
      .catch((e: any) => setError(e.message ?? t("adminDashboard.errorLoad")));
  }, [enabled, t]);

  useEffect(() => {
    load();
  }, [load]);

  useAblyChannel(enabled ? "dashboard" : undefined, {
    UPDATE: (data: unknown) => {
      const event = data as {
        scope?: DashboardActivity["scope"];
        message?: string;
        at?: string;
        targetId?: string | null;
        deviceId?: string | null;
      };
      if (event?.message) {
        setLiveActivity((prev) => [
          {
            id: `live-${Date.now()}-${Math.random()}`,
            scope: event.scope ?? "inventory",
            message: event.message!,
            at: event.at ?? new Date().toISOString(),
            targetId: event.targetId ?? null,
            deviceId: event.deviceId ?? null,
          },
          ...prev,
        ].slice(0, MAX_LIVE_ACTIVITY));
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(load, REFETCH_DEBOUNCE_MS);
    },
  });

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // El feed inicial (server-seeded) se mezcla con lo que llega en vivo desde
  // que se montó el dashboard; los eventos en vivo van primero.
  const activity: DashboardActivity[] = [
    ...liveActivity,
    ...(summary?.recentActivity ?? []).filter(
      (a) => !liveActivity.some((l) => l.message === a.message && l.scope === a.scope)
    ),
  ].slice(0, MAX_LIVE_ACTIVITY);

  return { t, summary, activity, error, setError };
};

export type UseAdminDashboard = ReturnType<typeof useAdminDashboard>;
