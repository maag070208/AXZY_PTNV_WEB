import { useCallback, useEffect, useState } from "react";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import { ticketsApi, type Ticket, type TicketFilterOptions } from "@entities/ticket";

const NO_OPTIONS: TicketFilterOptions = { categories: [], creators: [], assignees: [] };

export const useTicketsList = () => {
  const [filterOptions, setFilterOptions] = useState<TicketFilterOptions>(NO_OPTIONS);
  const [filterOptionsState, setFilterOptionsState] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
  };
};
