import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import {
  overtimeApi,
  type OvertimeDayRow,
  type OvertimeDayStatus,
  type OvertimeSummary,
} from "@entities/overtime";
import { departmentsApi, type Department } from "@entities/department";

export type Period = "DAY" | "WEEK" | "MONTH";
export type StatusFilter = "" | OvertimeDayStatus;

/** Día seleccionado para aprobar/rechazar. */
export interface SelectedDay {
  userId: string;
  date: string;
  extraMin: number;
}

/** Llave estable de un día (persona + fecha). */
export const dayKeyOf = (r: { userId: string; date: string }): string => `${r.userId}|${r.date}`;

const toDateInput = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const BROWSER_TIMEZONE =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Mexico_City";

interface Toast {
  message: string;
  type: "success" | "error";
}

/**
 * Estado de la pantalla de aprobación de tiempo extra: filtros, resumen, selección
 * múltiple y acciones de aprobar/rechazar. El cálculo de los pendientes lo hace la
 * API al vuelo; aquí solo se guardan las decisiones.
 */
export const useOvertimeApproval = () => {
  const { t } = useTranslation("overtime");
  const [period, setPeriod] = useState<Period>("WEEK");
  const [date, setDate] = useState<Date>(new Date());
  const [departmentId, setDepartmentId] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");

  const [summary, setSummary] = useState<OvertimeSummary | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selected, setSelected] = useState<Map<string, SelectedDay>>(new Map());
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<{ status: "APROBADO" | "RECHAZADO" } | null>(null);

  useEffect(() => {
    let active = true;
    departmentsApi
      .list()
      .then((list) => active && setDepartments(list))
      .catch(() => active && setDepartments([]));
    return () => {
      active = false;
    };
  }, []);

  /** Filtros base (sin `status`): los que se usan para recalcular los días al decidir. */
  const baseFilters = useMemo<Record<string, string | number | boolean>>(() => {
    const f: Record<string, string | number | boolean> = {
      period,
      date: toDateInput(date),
      tz: BROWSER_TIMEZONE,
    };
    if (departmentId) f.departmentId = departmentId;
    if (q.trim()) f.q = q.trim();
    return f;
  }, [period, date, departmentId, q]);

  /** Filtros externos de la tabla (incluyen `status`). */
  const externalFilters = useMemo<Record<string, string | number | boolean>>(
    () => (status ? { ...baseFilters, status } : baseFilters),
    [baseFilters, status]
  );

  const tableKey = useMemo(() => JSON.stringify(externalFilters), [externalFilters]);

  const fetchTableData = useCallback(async (params: ITDataTableFetchParams) => {
    const res = await overtimeApi.query({
      page: params.page,
      limit: params.limit,
      filters: params.filters as Record<string, string | number | boolean>,
      ...(params.sort ? { sort: params.sort } : {}),
    });
    setSummary(res.summary);
    return { data: res.data as unknown as Record<string, unknown>[], total: res.total };
  }, []);

  const toggleRow = useCallback((row: OvertimeDayRow) => {
    setSelected((prev) => {
      const next = new Map(prev);
      const key = dayKeyOf(row);
      if (next.has(key)) next.delete(key);
      else next.set(key, { userId: row.userId, date: row.date, extraMin: row.extraMin });
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Map()), []);

  /** Selecciona TODOS los pendientes del filtro (recorre las páginas). */
  const selectPending = useCallback(async () => {
    setError(null);
    try {
      const next = new Map<string, SelectedDay>();
      let page = 1;
      for (;;) {
        const res = await overtimeApi.query({
          page,
          limit: 100,
          filters: { ...baseFilters, status: "PENDIENTE" },
        });
        for (const r of res.data) {
          next.set(dayKeyOf(r), { userId: r.userId, date: r.date, extraMin: r.extraMin });
        }
        if (res.data.length === 0 || next.size >= res.total) break;
        page += 1;
      }
      setSelected(next);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [baseFilters]);

  const requestDecision = useCallback(
    (next: "APROBADO" | "RECHAZADO") => {
      if (selected.size === 0) return;
      setConfirm({ status: next });
    },
    [selected]
  );

  const confirmDecision = useCallback(async () => {
    if (!confirm) return;
    setSaving(true);
    setError(null);
    try {
      const items = [...selected.values()].map((s) => ({ userId: s.userId, date: s.date }));
      if (items.length === 0) return;
      const res = await overtimeApi.decide({
        filters: baseFilters,
        items,
        status: confirm.status,
      });
      setToast({
        message:
          confirm.status === "APROBADO"
            ? t("toast.approved", { count: res.updated })
            : t("toast.rejected", { count: res.updated }),
        type: "success",
      });
      setSelected(new Map());
      setReloadKey((k) => k + 1);
    } catch (e) {
      setToast({ message: (e as Error).message || t("toast.error"), type: "error" });
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  }, [confirm, selected, baseFilters, t]);

  const selectedMinutes = useMemo(
    () => [...selected.values()].reduce((acc, s) => acc + s.extraMin, 0),
    [selected]
  );

  return {
    period,
    setPeriod,
    date,
    setDate,
    departmentId,
    setDepartmentId,
    q,
    setQ,
    status,
    setStatus,
    summary,
    departments,
    externalFilters,
    tableKey,
    fetchTableData,
    selected,
    selectedCount: selected.size,
    selectedMinutes,
    toggleRow,
    clearSelection,
    selectPending,
    requestDecision,
    confirm,
    setConfirm,
    confirmDecision,
    saving,
    reloadKey,
    error,
    setError,
    toast,
    setToast,
  };
};

export type UseOvertimeApproval = ReturnType<typeof useOvertimeApproval>;
