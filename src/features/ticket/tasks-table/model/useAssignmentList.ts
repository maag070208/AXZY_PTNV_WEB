import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ticketsApi, type KanbanAssignment } from "@entities/ticket";
import { makeClientTableFetch } from "@shared/api/clientTable";

export const ASSIGNMENT_STATUS_BADGE: Record<string, { color: string }> = {
  PENDING: { color: "gray" },
  IN_PROGRESS: { color: "info" },
  IN_REVIEW: { color: "purple" },
  COMPLETED: { color: "success" },
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

  // Filtro y orden en memoria sobre las tareas ya cargadas (misma semántica que las tablas server-side).
  const fetchTableData = useMemo(
    () =>
      makeClientTableFetch<KanbanAssignment>(async () => rows, {
        title: { value: (r) => [r.title, r.description] },
        employee: { value: (r) => [r.user.name, r.user.employeeNumber], sortValue: (r) => r.user.name },
        ticket: { value: (r) => r.ticket.title },
        status: { match: "equals" },
        // Coincide si el inicio o la entrega caen en el rango; ordena por entrega.
        dates: { value: (r) => [r.startDate, r.dueDate], match: "date", sortValue: (r) => r.dueDate },
      }),
    [rows]
  );

  const overdue = useMemo(
    () =>
      rows.filter(
        (r) => r.status !== "COMPLETED" && r.dueDate && new Date(r.dueDate) < new Date()
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
    overdue,
  };
};

export type UseAssignmentList = ReturnType<typeof useAssignmentList>;