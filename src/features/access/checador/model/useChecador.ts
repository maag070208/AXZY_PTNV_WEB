import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import {
  checadorApi,
  type Checada,
  type ChecadorStatus,
  type MetodoChecada,
} from "@entities/checador";

/** Zona del navegador: los días del filtro se cortan igual que se muestran las horas. */
const BROWSER_TIMEZONE =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Mexico_City";

/** Refresco del estado mientras corre una sincronización o una importación. */
const STATUS_POLL_MS = 5_000;

/** Máximo de filas por página que acepta el contrato de tablas de la API. */
const EXPORT_PAGE_SIZE = 100;

export type ChecadorRangePreset = "today" | "yesterday" | "last7";

const pad = (n: number): string => String(n).padStart(2, "0");

/** Fecha local `YYYY-MM-DD` (la API resuelve el día en `tz`). */
const toDateInput = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** `DD/MM/AAAA` y `HH:mm:ss` locales, en columnas separadas para la hoja de cálculo. */
const fechaYHora = (iso: string): [string, string] => {
  const d = new Date(iso);
  return [
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
  ];
};

/**
 * Checadas del reloj Hikvision: filtros de la tabla server-side, estado de la
 * sincronización automática, importación manual por fechas (se refresca sola
 * mientras corre) y exportación CSV.
 */
export const useChecador = () => {
  const { t } = useTranslation(["checador", "common"]);

  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    new Date(),
    new Date(),
  ]);
  const [q, setQ] = useState("");
  const [metodo, setMetodo] = useState<MetodoChecada | "">("");
  const [reloadKey, setReloadKey] = useState(0);

  const [status, setStatus] = useState<ChecadorStatus | null>(null);
  const [starting, setStarting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await checadorApi.status());
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errors.status"));
    }
  }, [t]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const enCurso = status?.enCurso != null;
  const importando = status?.importacion != null && status.importacion.finishedAt == null;

  // Mientras algo corre se refresca el estado. Cuando termina, se recarga la
  // tabla y, si era una importación, se avisa el resultado.
  const previo = useRef({ enCurso: false, importando: false });
  useEffect(() => {
    const antes = previo.current;
    if ((antes.enCurso && !enCurso) || (antes.importando && !importando)) {
      setReloadKey((k) => k + 1);
    }
    const importacion = status?.importacion;
    if (antes.importando && !importando && importacion) {
      if (importacion.error) setError(importacion.error);
      else setToast(t("import.toast", { count: importacion.nuevas }));
    }
    previo.current = { enCurso, importando };
    if (!enCurso && !importando) return undefined;
    const timer = window.setTimeout(() => void loadStatus(), STATUS_POLL_MS);
    return () => window.clearTimeout(timer);
  }, [enCurso, importando, status, loadStatus, t]);

  const externalFilters = useMemo(() => {
    const filters: Record<string, string | number | boolean> = { tz: BROWSER_TIMEZONE };
    if (dateRange[0]) filters.desde = toDateInput(dateRange[0]);
    if (dateRange[1]) filters.hasta = toDateInput(dateRange[1]);
    const query = q.trim();
    if (query) filters.q = query;
    if (metodo) filters.metodo = metodo;
    return filters;
  }, [dateRange, q, metodo]);

  const fetchTableData = useCallback(async (params: ITDataTableFetchParams) => {
    const res = await checadorApi.table({
      page: params.page,
      limit: params.limit,
      filters: params.filters as Record<string, string | number | boolean>,
      sort: params.sort,
    });
    return {
      data: res.data as unknown as Record<string, unknown>[],
      total: res.total,
    };
  }, []);

  const applyRange = (preset: ChecadorRangePreset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (preset === "today") {
      setDateRange([today, today]);
      return;
    }
    if (preset === "yesterday") {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      setDateRange([y, y]);
      return;
    }
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    setDateRange([start, today]);
  };

  const clearFilters = () => {
    setDateRange([new Date(), new Date()]);
    setQ("");
    setMetodo("");
  };

  /** Arranca la importación; su avance llega por el sondeo de `status`. */
  const importar = useCallback(async (desde: string, hasta: string) => {
    setStarting(true);
    setError(null);
    try {
      const importacion = await checadorApi.importar({ desde, hasta, tz: BROWSER_TIMEZONE });
      setStatus((s) => (s ? { ...s, importacion } : s));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errors.import"));
    } finally {
      setStarting(false);
    }
  }, [t]);

  /** "Sincronizar ahora": trae las checadas de hoy, sin esperar a la carga automática. */
  const handleSyncToday = () => {
    const hoy = toDateInput(new Date());
    void importar(hoy, hoy);
  };

  /** Importa del reloj todo el rango de fechas seleccionado en los filtros. */
  const handleImportRange = () => {
    const [desde, hasta] = dateRange;
    if (!desde) return;
    void importar(toDateInput(desde), toDateInput(hasta ?? desde));
  };

  const handleExportCsv = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      const rows: Checada[] = [];
      for (let page = 1; ; page += 1) {
        const res = await checadorApi.table({
          page,
          limit: EXPORT_PAGE_SIZE,
          filters: externalFilters,
          sort: { key: "occurredAt", direction: "asc" },
        });
        rows.push(...res.data);
        if (res.data.length < EXPORT_PAGE_SIZE || rows.length >= res.total) break;
      }
      const header = [
        t("csv.fecha"),
        t("csv.hora"),
        t("csv.numeroEmpleado"),
        t("csv.nombre"),
        t("csv.metodo"),
        t("csv.serialNo"),
      ];
      const lines = rows.map((c) => [
        ...fechaYHora(c.occurredAt),
        c.numeroEmpleado,
        c.nombre,
        t(`metodos.${c.metodo}`),
        c.serialNo,
      ]);
      const escape = (cell: unknown) => `"${String(cell ?? "").replace(/"/g, '""')}"`;
      const csv = [header, ...lines].map((row) => row.map(escape).join(",")).join("\r\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `checadas-${String(externalFilters.desde ?? "")}_${String(externalFilters.hasta ?? "")}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errors.export"));
    } finally {
      setExporting(false);
    }
  }, [externalFilters, t]);

  return {
    t,
    dateRange,
    setDateRange,
    q,
    setQ,
    metodo,
    setMetodo,
    applyRange,
    clearFilters,
    externalFilters,
    fetchTableData,
    reloadKey,
    status,
    importando,
    starting,
    handleSyncToday,
    handleImportRange,
    exporting,
    handleExportCsv,
    error,
    setError,
    toast,
    setToast,
  };
};

export type UseChecador = ReturnType<typeof useChecador>;
