import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import {
  timeClockApi,
  type TimeClockEmployee,
  type TimeClockEmployeeStatus,
  type TimeClockEmployeesSummary,
} from "@entities/time-clock";
import { usersApi, useCan, type User } from "@entities/user";

/**
 * Empleados del reloj y su vínculo con los usuarios del sistema: tabla
 * server-side, aceptar sugerencias, vincular/cambiar con selector de usuario,
 * desvincular y vincular de un jalón las sugerencias seguras.
 */
export const useTimeClockEmployees = () => {
  const { t } = useTranslation(["time-clock", "common"]);
  // Mismo permiso que PUT/DELETE /checador/empleados en la API.
  const canLink = useCan("time_clock.link");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<TimeClockEmployeeStatus | "">("");
  const [reloadKey, setReloadKey] = useState(0);
  const [summary, setSummary] = useState<TimeClockEmployeesSummary | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [target, setTarget] = useState<TimeClockEmployee | null>(null);
  const [userId, setUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Usuarios activos (cualquier rol) para el selector; solo si puede vincular.
  useEffect(() => {
    if (!canLink) return undefined;
    let active = true;
    usersApi
      .employees()
      .then((list) => {
        if (active) setUsers(list);
      })
      .catch(() => {
        if (active) setError(t("employees.errors.users"));
      });
    return () => {
      active = false;
    };
  }, [canLink, t]);

  const externalFilters = useMemo(() => {
    const filters: Record<string, string | number | boolean> = {};
    const query = q.trim();
    if (query) filters.q = query;
    if (status) filters.status = status;
    return filters;
  }, [q, status]);

  const fetchTableData = useCallback(async (params: ITDataTableFetchParams) => {
    const res = await timeClockApi.employees({
      page: params.page,
      limit: params.limit,
      filters: params.filters as Record<string, string | number | boolean>,
      sort: params.sort,
    });
    setSummary(res.summary);
    return {
      data: res.data as unknown as Record<string, unknown>[],
      total: res.total,
    };
  }, []);

  const save = useCallback(
    async (row: TimeClockEmployee, uid: string) => {
      setSaving(true);
      setError(null);
      try {
        const res = await timeClockApi.linkEmployee(row.employeeNumber, uid);
        setToast(
          t("employees.toasts.linked", { number: row.employeeNumber, name: res.link?.name ?? "" })
        );
        setTarget(null);
        setReloadKey((k) => k + 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("employees.errors.save"));
      } finally {
        setSaving(false);
      }
    },
    [t]
  );

  /** Abre el diálogo con el usuario actual, o el sugerido, ya elegido. */
  const openLink = useCallback((row: TimeClockEmployee) => {
    setTarget(row);
    setUserId(row.link?.userId ?? row.suggestion?.userId ?? "");
  }, []);

  const confirm = () => {
    if (target && userId) void save(target, userId);
  };

  const acceptSuggestion = useCallback(
    (row: TimeClockEmployee) => {
      if (row.suggestion) void save(row, row.suggestion.userId);
    },
    [save]
  );

  const unlinkEmployee = useCallback(
    async (row: TimeClockEmployee) => {
      setError(null);
      try {
        await timeClockApi.unlinkEmployee(row.employeeNumber);
        setToast(t("employees.toasts.unlinked", { number: row.employeeNumber }));
        setReloadKey((k) => k + 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("employees.errors.save"));
      }
    },
    [t]
  );

  const linkSuggested = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const { linkedCount } = await timeClockApi.linkSuggested();
      setToast(t("employees.toasts.suggested", { count: linkedCount }));
      setReloadKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("employees.errors.save"));
    } finally {
      setSaving(false);
    }
  }, [t]);

  return {
    t,
    canLink,
    q,
    setQ,
    status,
    setStatus,
    externalFilters,
    fetchTableData,
    reloadKey,
    summary,
    users,
    target,
    setTarget,
    userId,
    setUserId,
    saving,
    openLink,
    confirm,
    acceptSuggestion,
    unlinkEmployee,
    linkSuggested,
    error,
    setError,
    toast,
    setToast,
  };
};

export type UseTimeClockEmployees = ReturnType<typeof useTimeClockEmployees>;
