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
import { FaSync, FaTasks, FaTrello } from "react-icons/fa";
import { Navigate, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@core/store/store";
import { ticketsApi, type KanbanAssignment } from "@core/api/tickets.api";

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  PENDIENTE: { color: "gray", label: "Pendiente" },
  EN_PROGRESO: { color: "info", label: "En progreso" },
  EN_REVISION: { color: "purple", label: "En revisión" },
  COMPLETADA: { color: "success", label: "Completada" },
};

export default function AdminTareasPage() {
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const [rows, setRows] = useState<KanbanAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    ticketsApi
      .kanban()
      .then((res) => setRows(res.data.filter((assignment) => !assignment.ticket.deletedAt)))
      .catch((e: any) => setError(e.message ?? "No se pudieron cargar las tareas"))
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

  const overdue = useMemo(
    () => rows.filter((row) => row.status !== "COMPLETADA" && row.dueDate && new Date(row.dueDate) < new Date()).length,
    [rows]
  );

  const columns: Column<KanbanAssignment>[] = [
    {
      key: "title",
      label: "Tarea",
      type: "string",
      sortable: false,
      render: (row) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[12px] font-black text-slate-800">{row.title}</ITText>
          {row.description && <ITText className="text-[10px] text-slate-500 line-clamp-2">{row.description}</ITText>}
        </ITFlex>
      ),
    },
    {
      key: "employee",
      label: "Empleado",
      type: "string",
      sortable: false,
      render: (row) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-bold text-slate-700">{row.user.name}</ITText>
          {row.user.numeroEmpleado && <ITText className="text-[9px] text-slate-400">No. {row.user.numeroEmpleado}</ITText>}
        </ITFlex>
      ),
    },
    {
      key: "ticket",
      label: "Ticket",
      type: "string",
      sortable: false,
      render: (row) => <ITText className="text-[11px] font-bold text-slate-600">{row.ticket.titulo}</ITText>,
    },
    {
      key: "status",
      label: "Estado",
      type: "string",
      sortable: false,
      render: (row) => (
        <ITBadget color={STATUS_BADGE[row.status]?.color as any ?? "gray"} size="small">
          {STATUS_BADGE[row.status]?.label ?? row.status}
        </ITBadget>
      ),
    },
    {
      key: "dates",
      label: "Fechas",
      type: "string",
      sortable: false,
      render: (row) => (
        <ITFlex direction="column" gap={0.5}>
          {row.startDate && <ITText className="text-[9px] text-slate-500">Inicio: {new Date(row.startDate).toLocaleDateString("es-MX")}</ITText>}
          {row.dueDate && <ITText className="text-[9px] text-slate-500">Fin: {new Date(row.dueDate).toLocaleDateString("es-MX")}</ITText>}
          {row.dueDate && row.status !== "COMPLETADA" && new Date(row.dueDate) < new Date() && <ITBadget color="danger" size="small">Vencida</ITBadget>}
        </ITFlex>
      ),
    },
  ];

  if (user?.role !== "ADMIN") return <Navigate to="/" replace />;

  return (
    <ITPage
      title="Administración de tareas"
      description={`${rows.length} tarea(s) de todos los tickets`}
      backAction={() => navigate(-1)}
      icon={<FaTasks size={20} />}
      breadcrumbs={[{ label: "Inicio", onClick: () => navigate("/") }, { label: "Administración de tareas" }]}
      actions={
        <ITFlex gap={2}>
          <ITButton variant="outlined" color="secondary" onClick={() => navigate("/tickets/kanban")}>
            <ITFlex align="center" gap={1}><FaTrello size={12} /><ITText className="font-bold text-[11px]">Ver Kanban completo</ITText></ITFlex>
          </ITButton>
          <ITButton variant="outlined" onClick={() => setReloadKey((key) => key + 1)}>
            <ITFlex align="center" gap={1}><FaSync size={11} /><ITText className="font-bold text-[11px]">Actualizar</ITText></ITFlex>
          </ITButton>
        </ITFlex>
      }
    >
      <ITFlex justify="end" align="center" gap={2} className="mb-3">
        {loading && <ITText className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cargando...</ITText>}
        {error && <ITText className="text-[11px] font-bold text-red-600">{error}</ITText>}
        {overdue > 0 && <ITBadget color="danger" size="small">{overdue} vencida(s)</ITBadget>}
      </ITFlex>
      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={fetchTableData as unknown as (params: ITDataTableFetchParams) => Promise<ITDataTableResponse<Record<string, unknown>>>}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={10}
        size="sm"
      />
    </ITPage>
  );
}
