import { useCallback, useEffect, useState } from "react";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import { ticketsApi, type Ticket } from "@entities/ticket";
import { usersApi } from "@entities/user";

export const useTicketsList = () => {
  const [categoryOptions, setCategoryOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [userOptions, setUserOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Catálogos para los filtros de Categoría, Creador y Responsable.
  useEffect(() => {
    ticketsApi
      .categories()
      .then((list) => setCategoryOptions(list.map((c) => ({ id: c.id, name: c.name }))))
      .catch(() => setCategoryOptions([]));
    usersApi
      .employees()
      .then((list) =>
        setUserOptions(
          list.map((u) => ({
            id: u.id,
            name: u.employeeNumber ? `${u.name} #${u.employeeNumber}` : u.name,
          }))
        )
      )
      .catch(() => setUserOptions([]));
  }, []);

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
    categoryOptions,
    userOptions,
    reloadKey,
    fetchTableData,
    ticketToDelete,
    setTicketToDelete,
    confirmDeleteTicket,
    deleteError,
    setDeleteError,
  };
};