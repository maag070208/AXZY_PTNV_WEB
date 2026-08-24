import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITFlex,
  ITGrid,
  ITInput,
  ITPage,
  ITSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaEye, FaPlus, FaTag } from "react-icons/fa";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  deviceTypesApi,
  devicesApi,
  type Device,
  type DeviceType,
} from "@core/api/devices.api";
import { useIsMobile } from "@modules/cartas/hooks/useIsMobile";
import DeviceCard from "../components/DeviceCard";

export default function DevicesListPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [types, setTypes] = useState<DeviceType[]>([]);
  const [filterType, setFilterType] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    deviceTypesApi
      .list()
      .then(setTypes)
      .catch(() => setTypes([]));
  }, []);

  const externalFilters: Record<string, string | number | boolean> =
    useMemo(() => {
      const out: Record<string, string | number | boolean> = {};
      if (filterType) out.typeId = filterType;
      if (filterEstado) out.estado = filterEstado;
      if (search) out.q = search;
      return out;
    }, [filterType, filterEstado, search]);

  const fetchTableData = useCallback(
    async (params: ITDataTableFetchParams) => {
      const res = await devicesApi.table({
        page: params.page,
        limit: params.limit,
        filters: params.filters as Record<string, string | number | boolean>,
        sort: params.sort,
      });
      setTotal(res.total);
      return {
        data: res.data as unknown as Record<string, unknown>[],
        total: res.total,
      };
    },
    []
  );

  const columns: any[] = useMemo(
    () => [
      {
        type: "string",
        key: "controlActivos",
        label: "ACTIVO",
        sortable: false,
        filter: true,
        render: (row: Device) => (
          <Link
            to={`/dispositivos/${row.id}`}
            className="text-[12px] font-black text-emerald-700 hover:underline"
          >
            {row.controlActivos}
          </Link>
        ),
      },
      {
        type: "string",
        key: "descripcion",
        label: "DESCRIPCIÓN",
        sortable: false,
        filter: true,
        render: (row: Device) => (
          <ITFlex direction="column" gap={0.5}>
            <ITText className="text-[12px] font-black text-slate-800">
              {row.descripcion}
            </ITText>
            <ITText className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {row.marca} {row.modelo}
            </ITText>
          </ITFlex>
        ),
      },
      {
        type: "string",
        key: "typeId",
        label: "TIPO",
        sortable: false,
        render: (row: Device) => (
          <ITText className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
            {row.type?.name}
          </ITText>
        ),
      },
      {
        type: "string",
        key: "estado",
        label: "ESTADO",
        sortable: false,
        render: (row: Device) => (
          <ITBadget
            color={row.estado === "DISPONIBLE" ? "success" : row.estado === "ASIGNADO" ? "warning" : "default"}
            size="small"
          >
            {row.estado}
          </ITBadget>
        ),
      },
      {
        type: "actions",
        key: "actions",
        label: "",
        align: "right",
        render: (row: Device) => (
          <ITFlex gap={1}>
            <ITButton
              variant="outlined"
              size="small"
              color="secondary"
              onClick={() => navigate(`/dispositivos/${row.id}`)}
              title="Ver detalle"
            >
              <FaEye size={14} />
            </ITButton>
          </ITFlex>
        ),
      },
    ],
    [navigate]
  );

  const renderCard = useCallback(
    (row: Record<string, unknown>) => (
      <DeviceCard
        device={row as unknown as Device}
        onClick={(id) => navigate(`/dispositivos/${id}`)}
      />
    ),
    [navigate]
  );

  return (
    <ITPage
      title="Dispositivos"
      description={`${total} dispositivo(s) · ${types.length} tipo(s)`}
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: "Inicio", onClick: () => navigate("/") },
        { label: "Dispositivos" },
      ]}
      actions={
        <ITFlex gap={2}>
          <ITButton
            variant="outlined"
            color="secondary"
            onClick={() => navigate("/dispositivos/tipos")}
          >
            <ITFlex align="center" gap={1}>
              <FaTag size={12} />
              <ITText className="font-bold text-[11px]">Tipos</ITText>
            </ITFlex>
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            onClick={() => navigate("/dispositivos/nuevo")}
          >
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">Nuevo</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
      error={null}
      icon={<FaBoxOpen size={20} />}
    >
      <ITGrid container columns={12} spacing={3} className="mb-4">
        <ITGrid item xs={12} md={4}>
          <ITSelect
            name="filterType"
            options={types.map((t) => ({ value: t.id, label: t.name }))}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            placeholder="Todos los tipos"
          />
        </ITGrid>
        <ITGrid item xs={12} md={4}>
          <ITSelect
            name="filterEstado"
            options={[
              { value: "", label: "Todos los estados" },
              { value: "DISPONIBLE", label: "DISPONIBLE" },
              { value: "ASIGNADO", label: "ASIGNADO" },
              { value: "BAJA", label: "BAJA" },
            ]}
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          />
        </ITGrid>
        <ITGrid item xs={12} md={4}>
          <ITInput
            name="search"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </ITGrid>
      </ITGrid>

      <ITDataTable
        columns={columns as any}
        fetchData={
          fetchTableData as unknown as (
            p: ITDataTableFetchParams
          ) => Promise<ITDataTableResponse<Record<string, unknown>>>
        }
        externalFilters={externalFilters}
        renderCard={renderCard}
        defaultView={isMobile ? "cards" : "table"}
        defaultItemsPerPage={20}
        size="sm"
      />
    </ITPage>
  );
}