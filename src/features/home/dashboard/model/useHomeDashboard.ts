import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@app/store";
import { cartasApi } from "@entities/carta";
import { deviceApi as devicesApi } from "@entities/device";
import { departmentsApi } from "@entities/department";
import { usersApi } from "@entities/user";
import { ticketsApi } from "@entities/ticket";

export type HomeCounts = Record<string, number>;

export const useHomeDashboard = () => {
  const user = useSelector((s: RootState) => s.auth.user);
  const [counts, setCounts] = useState<HomeCounts>({});

  const isAdmin = user?.role === "ADMIN" || user?.role === "GERENTE";
  const isJefeArea = user?.role === "JEFE_DE_AREA";
  const canManage = isAdmin || isJefeArea;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const jobs: Array<[string, Promise<{ total: number }>]> = [];
      if (canManage || user?.role === "EMPLEADO") {
        jobs.push(["cartas", cartasApi.table({ page: 1, limit: 1, filters: {} })]);
        jobs.push(["tickets", ticketsApi.table({ page: 1, limit: 1, filters: {} })]);
      }
      if (canManage) {
        jobs.push([
          "empleados",
          usersApi.table({ page: 1, limit: 1, filters: { role: "EMPLEADO" } }),
        ]);
      }
      if (isAdmin) {
        jobs.push(["dispositivos", devicesApi.table({ page: 1, limit: 1, filters: {} })]);
        jobs.push([
          "departamentos",
          departmentsApi.table({ page: 1, limit: 1, filters: {} }),
        ]);
        jobs.push(["usuarios", usersApi.table({ page: 1, limit: 1, filters: {} })]);
      }
      const results = await Promise.allSettled(jobs.map(([, p]) => p));
      if (cancelled) return;
      const next: HomeCounts = {};
      jobs.forEach(([key], i) => {
        const r = results[i];
        if (r.status === "fulfilled") next[key] = r.value.total;
      });
      setCounts(next);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [canManage, isAdmin, user?.role]);

  return { user, isAdmin, isJefeArea, canManage, counts };
};

export type UseHomeDashboard = ReturnType<typeof useHomeDashboard>;