import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnFilters, ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import { ticketsApi, UNASSIGNED, type Ticket, type TicketFilterOptions } from "@entities/ticket";

const NO_OPTIONS: TicketFilterOptions = { categories: [], creators: [], assignees: [] };

/** Mosaicos de la franja de resumen; cada uno aplica un filtro a la tabla. */
export type QuickFilter = "open" | "followUp" | "unassigned" | "closed";

const QUICK_FILTERS: Record<QuickFilter, ColumnFilters> = {
  open: { status: "OPEN" },
  followUp: { status: "IN_PROGRESS" },
  unassigned: { assignedToId: UNASSIGNED },
  closed: { status: "CLOSED" },
};

export type TicketSummary = Record<QuickFilter, number>;

export const useTicketsList = () => {
  const [filterOptions, setFilterOptions] = useState<TicketFilterOptions>(NO_OPTIONS);
  const [filterOptionsState, setFilterOptionsState] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState<QuickFilter | null>(null);
  const [summary, setSummary] = useState<TicketSummary | null>(null);

  // Opciones de Categoría, Creador y Responsable: salen de los tickets
  // visibles, así cada opción tiene resultados. Se recargan con la tabla.
  useEffect(() => {
    setFilterOptionsState("loading");
    ticketsApi
      .filterOptions()
      .then((options) => {
        setFilterOptions(options);
        setFilterOptionsState("ready");
      })
      .catch(() => setFilterOptionsState("error"));
  }, [reloadKey]);

  // Totales de la franja: el `total` de la misma consulta de la tabla con cada
  // filtro rápido, así el número del mosaico es exactamente lo que filtra.
  useEffect(() => {
    let cancelled = false;
    const keys = Object.keys(QUICK_FILTERS) as QuickFilter[];
    Promise.all(keys.map((k) => ticketsApi.table({ page: 1, limit: 1, filters: QUICK_FILTERS[k] })))
      .then((results) => {
        if (cancelled) return;
        setSummary(Object.fromEntries(keys.map((k, i) => [k, results[i].total])) as TicketSummary);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const confirmDeleteTicket = async () => {
    if (!ticketToDelete) return;
    try {
      await ticketsApi.remove(ticketToDelete.id);
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setDeleteError(e.message);
    }
    setTicketToDelete(null);
  };

  const fetchTableData = useCallback(async (params: ITDataTableFetchParams) => {
    const res = await ticketsApi.table(params);
    return {
      data: res.data as unknown as Record<string, unknown>[],
      total: res.total,
    };
  }, []);

  // Clic en el mosaico activo = quitar el filtro.
  const toggleQuickFilter = useCallback((id: QuickFilter) => {
    setQuickFilter((cur) => (cur === id ? null : id));
  }, []);

  const externalFilters = useMemo<ColumnFilters>(() => (quickFilter ? QUICK_FILTERS[quickFilter] : {}), [quickFilter]);

  return {
    filterOptions,
    filterOptionsLoading: filterOptionsState === "loading",
    filterOptionsError: filterOptionsState === "error",
    reloadKey,
    fetchTableData,
    ticketToDelete,
    setTicketToDelete,
    confirmDeleteTicket,
    deleteError,
    setDeleteError,
    summary,
    quickFilter,
    toggleQuickFilter,
    clearQuickFilter: () => setQuickFilter(null),
    externalFilters,
  };
};
