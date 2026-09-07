import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITFlex,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaTasks, FaSync, FaTrello } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ticketsApi, type KanbanAssignment } from "@core/api/tickets.api";

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  PENDIENTE: { color: "gray", label: "Pendiente" },
  EN_PROGRESO: { color: "info", label: "En progreso" },
  EN_REVISION: { color: "purple", label: "En revisión" },
  COMPLETADA: { color: "success", label: "Completada" },
};

export default function MisTareasPage() {
  const navigate = useNavigate();
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
      .catch((e: any) => setError(e.message ?? "No se pudieron cargar tus tareas"))
      .finally(() => setLoading(false));
  }, []);

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

  const columns: Column<KanbanAssignment>[] = [
    {
      key: "title",
      label: "Tarea",
      type: "string",
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[12px] font-black text-slate-800">{r.title}</ITText>
          {r.description && (
            <ITText className="text-[10px] text-slate-500 line-clamp-2">{r.description}</ITText>
          )}
        </ITFlex>
      ),
    },
    {
      key: "ticket",
      label: "Ticket",
      type: "string",
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] font-bold text-slate-600">{r.ticket.titulo}</ITText>
      ),
    },
    {
      key: "status",
      label: "Estado",
      type: "string",
      sortable: false,
      render: (r) => (
        <ITBadget color={STATUS_BADGE[r.status]?.color as any ?? "gray"} size="small">
          {STATUS_BADGE[r.status]?.label ?? r.status}
        </ITBadget>
      ),
    },
    {
      key: "dates",
      label: "Fechas",
      type: "string",
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          {r.startDate && (
            <ITText className="text-[9px] text-slate-500">
              Inicio: {new Date(r.startDate).toLocaleDateString("es-MX")}
            </ITText>
          )}
          {r.dueDate && (
            <ITText className="text-[9px] text-slate-500">
              Fin: {new Date(r.dueDate).toLocaleDateString("es-MX")}
            </ITText>
          )}
          {r.dueDate && r.status !== "COMPLETADA" && new Date(r.dueDate) < new Date() && (
            <ITBadget color="danger" size="small">Vencida</ITBadget>
          )}
        </ITFlex>
      ),
    },
    {
      key: "acciones",
      label: "",
      type: "string",
      sortable: false,
      render: () => (
        <ITFlex justify="end">
          <ITButton
            variant="outlined"
            size="small"
            color="secondary"
            onClick={() => navigate("/tickets/kanban")}
            title="Ver en el tablero kanban"
          >
            <FaTrello size={12} />
          </ITButton>
        </ITFlex>
      ),
    },
  ];

  return (
    <ITPage
      title="Mis Tareas"
      description={`${rows.length} tarea(s) asignada(s) a ti`}
      backAction={() => navigate(-1)}
      icon={<FaTasks size={20} />}
      breadcrumbs={[
        { label: "Inicio", onClick: () => navigate("/") },
        { label: "Mis Tareas" },
      ]}
      actions={
        <ITButton variant="outlined" color="secondary" onClick={() => navigate("/tickets/kanban")}>
          <ITFlex align="center" gap={1}>
            <FaTrello size={12} />
            <ITText className="font-bold text-[11px]">Ver tablero kanban</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <ITFlex justify="end" align="center" gap={2} className="mb-3">
        {loading && (
          <ITText className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Cargando…
          </ITText>
        )}
        {error && <ITText className="text-[11px] font-bold text-red-600">{error}</ITText>}
        {vencidas > 0 && (
          <ITBadget color="danger" size="small">{vencidas} vencida(s)</ITBadget>
        )}
        <ITButton variant="outlined" onClick={() => setReloadKey((k) => k + 1)}>
          <ITFlex align="center" gap={1}>
            <FaSync size={11} />
            <ITText className="font-bold text-[11px]">Actualizar</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={
          fetchTableData as unknown as (
            p: ITDataTableFetchParams
          ) => Promise<ITDataTableResponse<Record<string, unknown>>>
        }
        reloadTrigger={reloadKey}
        defaultItemsPerPage={10}
        size="sm"
      />
    </ITPage>
  );
}