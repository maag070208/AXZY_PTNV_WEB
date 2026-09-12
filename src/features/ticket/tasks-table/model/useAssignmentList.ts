import { useCallback, useEffect, useMemo, useState } from "react";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { ticketsApi, type KanbanAssignment } from "@entities/ticket";

export const ASSIGNMENT_STATUS_BADGE: Record<string, { color: string; label: string }> = {
  PENDIENTE: { color: "gray", label: "Pendiente" },
  EN_PROGRESO: { color: "info", label: "En progreso" },
  EN_REVISION: { color: "purple", label: "En revisión" },
  COMPLETADA: { color: "success", label: "Completada" },
};

export const useAssignmentList = (loadErrorKey: string) => {
  const { t: tt } = useTranslation("tickets");
  const [rows, setRows] = useState<KanbanAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    ticketsApi
      .kanban()
      .then((res) => setRows(res.data.filter((a) => !a.ticket.deletedAt)))
      .catch((e: any) => setError(e.message ?? tt(loadErrorKey as any)))
      .finally(() => setLoading(false));
  }, [tt, loadErrorKey]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const fetchTableData = useCallback(
    async (params: ITDataTableFetchParams) => {
      const start = (params.page - 1) * params.limit;
      const page = rows.slice(start, start + params.limit);
      return {
        data: page as unknown as Record<string, unknown>[],
        total: rows.length,
      };
    },
    [rows]
  );

  const vencidas = useMemo(
    () =>
      rows.filter(
        (r) => r.status !== "COMPLETADA" && r.dueDate && new Date(r.dueDate) < new Date()
      ).length,
    [rows]
  );

  return {
    rows,
    loading,
    error,
    setError,
    reloadKey,
    reload: () => setReloadKey((k) => k + 1),
    fetchTableData,
    vencidas,
  };
};

export type UseAssignmentList = ReturnType<typeof useAssignmentList>;