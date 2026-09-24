import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import {
  checadorApi,
  type Checada,
  type ChecadorStatus,
  type MetodoChecada,
} from "@entities/checador";

/** Refresco del estado mientras corre una sincronización o una importación. */
const STATUS_POLL_MS = 5_000;

/** Máximo de filas por página que acepta el contrato de tablas de la API. */
const EXPORT_PAGE_SIZE = 100;

/** Llave de orden de la tabla de checadas. */
type ChecadasSort = NonNullable<ITDataTableFetchParams["sort"]>;

/**
 * Orden por defecto: checada más reciente primero. Un solo lugar para la tabla
 * y el CSV, que así respeta el orden que ve el usuario.
 */
const DEFAULT_CHECADAS_SORT: ChecadasSort = { key: "occurredAt", direction: "desc" };

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
 * Checadas de los relojes Hikvision: filtros de la tabla server-side, estado de
 * la sincronización de cada reloj, importación manual por fechas (se refresca
 * sola mientras corre) y exportación CSV.
 */
export const useChecador = () => {
  const { t } = useTranslation(["checador", "common"]);

  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    new Date(),
    new Date(),
  ]);
  const [q, setQ] = useState("");
  const [metodo, setMetodo] = useState<MetodoChecada | "">("");
  /** Serie del reloj ("" = todos). */
  const [reloj, setReloj] = useState("");
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
  // tabla y se avisa el resultado (drenado de los relojes o importación por
  // rango). `desde` es cuándo empezó lo que se vio correr: sus corridas son
  // las que se reportan.
  const previo = useRef({ enCurso: false, importando: false, desde: 0 });
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
    if (antes.enCurso && !enCurso) {
      const terminadas = (status?.dispositivos ?? []).filter(
        (d) => d.ultimaCorrida && Date.parse(d.ultimaCorrida.startedAt) >= antes.desde
      );
      const fallidas = terminadas.filter((d) => !d.ultimaCorrida!.ok);
      if (fallidas.length > 0) {
        setError(
          fallidas.map((d) => `${d.nombre}: ${d.ultimaCorrida!.error ?? t("errors.sync")}`).join(" · ")
        );
      } else if (terminadas.length > 0) {
        const nuevas = terminadas.reduce((acc, d) => acc + d.ultimaCorrida!.nuevas, 0);
        setToast(t("sync.toast", { count: nuevas }));
      }
    }
    const desde = !enCurso ? 0 : antes.enCurso ? antes.desde : Date.parse(status!.enCurso!.startedAt);
    previo.current = { enCurso, importando, desde };
    if (!enCurso && !importando) return undefined;
    const timer = window.setTimeout(() => void loadStatus(), STATUS_POLL_MS);
    return () => window.clearTimeout(timer);
  }, [enCurso, importando, status, loadStatus, t]);

  /**
   * Avance del drenado con métricas derivadas (para la tarjeta). La velocidad
   * es la de toda la corrida: el avance llega por ventanas, a saltos, y una
   * muestra entre dos refrescos exageraría.
   */
  const progreso = useMemo(() => {
    const p = status?.enCurso;
    if (!p) return null;
    const { total } = p;
    const segundos = (Date.now() - Date.parse(p.startedAt)) / 1000;
    const rate = p.leidos > 0 && segundos > 0 ? p.leidos / segundos : null;
    return {
      ...p,
      /** Eventos que faltan según el total de la corrida. */
      faltan: total != null ? Math.max(0, total - p.leidos) : null,
      /** % de eventos del reloj revisados (no de checadas). */
      percent: total != null && total > 0 ? Math.min(100, Math.round((p.leidos / total) * 100)) : null,
      rate,
      eta: rate != null && total != null ? Math.max(0, Math.round((total - p.leidos) / rate)) : null,
    };
  }, [status?.enCurso]);

  const externalFilters = useMemo(() => {
    const filters: Record<string, string | number | boolean> = {};
    if (dateRange[0]) filters.desde = toDateInput(dateRange[0]);
    if (dateRange[1]) filters.hasta = toDateInput(dateRange[1]);
    const query = q.trim();
    if (query) filters.q = query;
    if (metodo) filters.metodo = metodo;
    if (reloj) filters.dispositivoSerie = reloj;
    return filters;
  }, [dateRange, q, metodo, reloj]);

  // Sort vigente de la tabla, compartido con el export. Al cambiar los filtros
  // la tabla se remonta y pierde su orden: el ref vuelve al default.
  const sortRef = useRef<ChecadasSort>(DEFAULT_CHECADAS_SORT);

  useEffect(() => {
    sortRef.current = DEFAULT_CHECADAS_SORT;
  }, [externalFilters]);

  const fetchTableData = useCallback(async (params: ITDataTableFetchParams) => {
    const sort = params.sort ?? DEFAULT_CHECADAS_SORT;
    sortRef.current = sort;
    const res = await checadorApi.table({
      page: params.page,
      limit: params.limit,
      filters: params.filters as Record<string, string | number | boolean>,
      sort,
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
    setReloj("");
  };

  /** Arranca la importación; su avance llega por el sondeo de `status`. */
  const importar = useCallback(async (desde: string, hasta: string) => {
    setStarting(true);
    setError(null);
    try {
      const importacion = await checadorApi.importar({ desde, hasta });
      setStatus((s) => (s ? { ...s, importacion } : s));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errors.import"));
    } finally {
      setStarting(false);
    }
  }, [t]);

  /**
   * "Sincronizar todo": drena de cada reloj lo que falte desde su cursor (el
   * rezago completo), sin esperar a la sincronización automática. Su avance
   * llega por el sondeo de `status`.
   */
  const handleSyncAll = useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      const inicial = await checadorApi.sync();
      setStatus((s) => (s ? { ...s, enCurso: inicial } : s));
    } catch (e) {
      const httpStatus =
        typeof e === "object" && e !== null ? (e as { status?: number }).status : undefined;
      setError(httpStatus === 409 ? t("sync.alreadyRunning") : t("errors.sync"));
    } finally {
      setStarting(false);
    }
  }, [t]);

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
          sort: sortRef.current,
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
        t("csv.reloj"),
        t("csv.serialNo"),
      ];
      const lines = rows.map((c) => [
        ...fechaYHora(c.occurredAt),
        c.numeroEmpleado,
        c.nombre,
        t(`metodos.${c.metodo}`),
        c.reloj ?? c.dispositivoSerie,
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
    reloj,
    setReloj,
    applyRange,
    clearFilters,
    externalFilters,
    fetchTableData,
    reloadKey,
    status,
    enCurso,
    progreso,
    importando,
    starting,
    handleSyncAll,
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
