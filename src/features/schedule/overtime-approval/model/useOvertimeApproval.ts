import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import {
  overtimeApi,
  type OvertimeDayRow,
  type OvertimeDayStatus,
  type OvertimeSummary,
} from "@entities/overtime";
import { departmentsApi, type Department } from "@entities/department";
import { formatDateTime, formatMinutesAsHhMm } from "@shared/utils/dates";
import type { DownloadOvertimePdf } from "./types";
import { fileName } from "@shared/i18n";

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

interface UseOvertimeApprovalOptions {
  /** ADMIN/GERENTE deciden; el resto (RH) entra en modo solo lectura. */
  canApprove: boolean;
  /** Generador del PDF de aprobados, inyectado desde la página. */
  downloadPdf: DownloadOvertimePdf;
}

/**
 * Estado de la pantalla de tiempo extra: filtros, resumen, selección múltiple,
 * aprobar/rechazar y exportación. El cálculo de los pendientes lo hace la API al
 * vuelo; aquí solo se guardan las decisiones. Quien no puede aprobar (RH) queda
 * en modo solo lectura: el servidor además le devuelve únicamente lo aprobado.
 */
export const useOvertimeApproval = ({
  canApprove,
  downloadPdf,
}: UseOvertimeApprovalOptions) => {
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
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [confirm, setConfirm] = useState<{ status: "APPROVED" | "REJECTED" } | null>(null);
  /** Filtros/orden vigentes de la tabla (barra + columnas), para el export. */
  const tableParamsRef = useRef<ITDataTableFetchParams | null>(null);

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
    };
    if (departmentId) f.departmentId = departmentId;
    if (q.trim()) f.q = q.trim();
    return f;
  }, [period, date, departmentId, q]);

  /** Filtros externos de la tabla. Quien no aprueba queda fijo en APROBADO. */
  const effectiveStatus = canApprove ? status : "APPROVED";
  const externalFilters = useMemo<Record<string, string | number | boolean>>(
    () => (effectiveStatus ? { ...baseFilters, status: effectiveStatus } : baseFilters),
    [baseFilters, effectiveStatus]
  );

  const tableKey = useMemo(() => JSON.stringify(externalFilters), [externalFilters]);

  const fetchTableData = useCallback(async (params: ITDataTableFetchParams) => {
    tableParamsRef.current = params;
    const res = await overtimeApi.query({
      page: params.page,
      limit: params.limit,
      filters: params.filters,
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
    if (!canApprove) return;
    setError(null);
    try {
      const next = new Map<string, SelectedDay>();
      let page = 1;
      for (;;) {
        const res = await overtimeApi.query({
          page,
          limit: 100,
          filters: { ...baseFilters, status: "PENDING" },
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
  }, [baseFilters, canApprove]);

  const requestDecision = useCallback(
    (next: "APPROVED" | "REJECTED") => {
      if (!canApprove || selected.size === 0) return;
      setConfirm({ status: next });
    },
    [canApprove, selected]
  );

  const confirmDecision = useCallback(async () => {
    if (!canApprove || !confirm) return;
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
          confirm.status === "APPROVED"
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
  }, [canApprove, confirm, selected, baseFilters, t]);

  const selectedMinutes = useMemo(
    () => [...selected.values()].reduce((acc, s) => acc + s.extraMin, 0),
    [selected]
  );

  /**
   * Todas las filas del filtro vigente de la tabla (barra + columnas), sin
   * paginar: recorre las páginas de a 200 (tope del API). Lo comparten PDF y CSV
   * para que exporten exactamente lo que se ve.
   */
  const fetchAllForExport = useCallback(async (): Promise<{
    rows: OvertimeDayRow[];
    summary: OvertimeSummary;
  } | null> => {
    const base = tableParamsRef.current;
    const filters = base?.filters ?? externalFilters;
    const sort = base?.sort;
    const rows: OvertimeDayRow[] = [];
    let summary: OvertimeSummary | null = null;
    let page = 1;
    for (;;) {
      const res = await overtimeApi.query({
        page,
        limit: 200,
        filters,
        ...(sort ? { sort } : {}),
      });
      summary = res.summary;
      rows.push(...res.data);
      if (rows.length >= res.total || res.data.length === 0) break;
      page += 1;
    }
    return summary ? { rows, summary } : null;
  }, [externalFilters]);

  /** Exporta a PDF la tabla tal cual: los días del filtro vigente con su estado. */
  const exportPdf = useCallback(async () => {
    setExportingPdf(true);
    setError(null);
    try {
      const data = await fetchAllForExport();
      if (!data || data.rows.length === 0) {
        setToast({ message: t("exportEmpty"), type: "error" });
        return;
      }
      await downloadPdf({
        rows: data.rows,
        summary: data.summary,
        meta: {
          period,
          date: toDateInput(date),
          timezone: data.summary.range.timezone || BROWSER_TIMEZONE,
        },
        canApprove,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExportingPdf(false);
    }
  }, [fetchAllForExport, period, date, downloadPdf, t, canApprove]);

  /** Exporta a CSV las mismas filas que el PDF (la tabla tal cual). */
  const exportCsv = useCallback(async () => {
    setExportingCsv(true);
    setError(null);
    try {
      const data = await fetchAllForExport();
      if (!data || data.rows.length === 0) {
        setToast({ message: t("exportEmpty"), type: "error" });
        return;
      }
      const statusKey = {
        PENDING: "statusPending",
        APPROVED: "statusApproved",
        REJECTED: "statusRejected",
      } as const;
      const header = [
        t("columns.employee"),
        t("columns.department"),
        t("columns.date"),
        t("columns.schedule"),
        canApprove ? t("columns.extra") : t("statusApproved"),
        t("status"),
        t("columns.decidedBy"),
        t("columns.decidedAt"),
        t("columns.note"),
      ];
      const lines = data.rows.map((r) => [
        r.employeeNumber ? `${r.employeeName} (#${r.employeeNumber})` : r.employeeName,
        r.departmentName ?? "",
        r.date,
        r.scheduleName ?? t("columns.noSchedule"),
        formatMinutesAsHhMm(canApprove ? r.extraMin : r.approvedExtraMin),
        t(statusKey[r.status]),
        r.decidedByName ?? "",
        r.decidedAt ? formatDateTime(r.decidedAt) : "",
        r.note ?? "",
      ]);
      const escape = (c: unknown) => `"${String(c ?? "").replace(/"/g, '""')}"`;
      const csv = [header, ...lines].map((row) => row.map(escape).join(",")).join("\r\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName("overtimeReport")}-${period.toLowerCase()}-${toDateInput(date)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExportingCsv(false);
    }
  }, [fetchAllForExport, period, date, t, canApprove]);

  return {
    canApprove,
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
    exportPdf,
    exportCsv,
    exportingPdf,
    exportingCsv,
    reloadKey,
    error,
    setError,
    toast,
    setToast,
  };
};

export type UseOvertimeApproval = ReturnType<typeof useOvertimeApproval>;
