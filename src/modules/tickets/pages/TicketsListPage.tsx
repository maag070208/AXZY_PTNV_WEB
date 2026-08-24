import {
  ITBadget,
  ITButton,
  ITCard,
  ITDataTable,
  ITFlex,
  ITPage,
  ITStack,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { useCallback, useState } from "react";
import { FaCheckCircle, FaEye, FaPlus, FaTicketAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ticketsApi, type Ticket } from "@core/api/tickets.api";

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  ABIERTO: { color: "warning", label: "Abierto" },
  EN_SEGUIMIENTO: { color: "info", label: "En seguimiento" },
  CERRADO: { color: "success", label: "Cerrado" },
};

const PRIORITY_BADGE: Record<string, { color: string; label: string }> = {
  BAJA: { color: "default", label: "Baja" },
  MEDIA: { color: "warning", label: "Media" },
  ALTA: { color: "danger", label: "Alta" },
  URGENTE: { color: "danger", label: "Urgente" },
};

const CATEGORY_LABELS: Record<string, string> = {
  MANTENIMIENTO: "Mantenimiento",
  EQUIPO: "Equipo",
  SISTEMA: "Sistema",
  OTRO: "Otro",
};

const STATUS_LABELS: Record<string, string> = {
  ABIERTO: "Abierto",
  EN_SEGUIMIENTO: "En seguimiento",
  CERRADO: "Cerrado",
};

export default function TicketsListPage() {
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);

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

  const columns: Column<Ticket>[] = [
    {
      key: "titulo",
      label: "Título",
      type: "string",
      filter: true,
      render: (t) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[12px] font-black text-slate-800">{t.titulo}</ITText>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase">
            {CATEGORY_LABELS[t.category] ?? t.category}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "status",
      label: "Estado",
      type: "catalog",
      filter: "catalog",
      catalogOptions: {
        data: Object.entries(STATUS_LABELS).map(([id, name]) => ({ id, name })),
        loading: false,
        error: false,
      },
      render: (t) => (
        <ITBadget color={STATUS_BADGE[t.status]?.color as any ?? "default"} size="small">
          {STATUS_BADGE[t.status]?.label ?? t.status}
        </ITBadget>
      ),
    },
    {
      key: "priority",
      label: "Prioridad",
      type: "catalog",
      filter: "catalog",
      catalogOptions: {
        data: [
          { id: "BAJA", name: "Baja" },
          { id: "MEDIA", name: "Media" },
          { id: "ALTA", name: "Alta" },
          { id: "URGENTE", name: "Urgente" },
        ],
        loading: false,
        error: false,
      },
      render: (t) => (
        <ITBadget color={PRIORITY_BADGE[t.priority]?.color as any ?? "default"} size="small">
          {PRIORITY_BADGE[t.priority]?.label ?? t.priority}
        </ITBadget>
      ),
    },
    {
      key: "creadoPor",
      label: "Creado por",
      type: "string",
      render: (t) => (
        <ITText className="text-[11px] font-bold text-slate-600">
          {t.creadoPor?.name ?? "—"}
        </ITText>
      ),
    },
    {
      key: "asignadoA",
      label: "Asignado a",
      type: "string",
      render: (t) => (
        <ITText className="text-[11px] font-bold text-slate-600">
          {t.asignadoA?.name ?? "Sin asignar"}
        </ITText>
      ),
    },
    {
      key: "acciones",
      label: "",
      type: "string",
      render: (t) => (
        <ITFlex gap={1}>
          <ITButton
            variant="outlined"
            size="small"
            color="secondary"
            onClick={() => navigate(`/tickets/${t.id}`)}
          >
            <FaEye size={12} />
          </ITButton>
        </ITFlex>
      ),
    },
  ];

  return (
    <ITPage
      title="Tickets"
      description="Seguimiento de solicitudes y reportes"
      backAction={() => navigate(-1)}
      icon={<FaTicketAlt size={20} />}
      breadcrumbs={[
        { label: "Inicio", onClick: () => navigate("/") },
        { label: "Tickets" },
      ]}
      actions={
        <ITButton
          variant="filled"
          color="primary"
          onClick={() => navigate("/tickets/nuevo")}
        >
          <ITFlex align="center" gap={1}>
            <FaPlus size={12} />
            <ITText className="font-bold text-[11px]">Nuevo ticket</ITText>
          </ITFlex>
        </ITButton>
      }
    >
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
