import { useCallback, useState } from "react";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import { ticketsApi, type Ticket } from "@entities/ticket";

export const useTicketsList = () => {
  const [reloadKey, setReloadKey] = useState(0);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const fetchTableData = useCallback(
    async (params: ITDataTableFetchParams) => {
      const res = await ticketsApi.table({
        page: params.page,
        limit: params.limit,
        filters: params.filters as Record<string, string | number | boolean>,
        sort: params.sort,
      });
      return {
        data: res.data as unknown as Record<string, unknown>[],
        total: res.total,
      };
    },
    []
  );

  return {
    reloadKey,
    fetchTableData,
    ticketToDelete,
    setTicketToDelete,
    confirmDeleteTicket,
    deleteError,
    setDeleteError,
  };
};