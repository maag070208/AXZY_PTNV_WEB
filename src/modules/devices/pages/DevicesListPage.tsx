import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITConfirmDialog,
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
import { FaBoxOpen, FaCheckCircle, FaEdit, FaEye, FaExclamationTriangle, FaFileExcel, FaLayerGroup, FaLock, FaPlus, FaTag, FaTimesCircle, FaTrash, FaTrashRestore } from "react-icons/fa";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@core/store/store";
import {
  deviceTypesApi,
  devicesApi,
  type Device,
  type DeviceSummary,
  type DeviceType,
} from "@core/api/devices.api";
import { useIsMobile } from "@modules/cartas/hooks/useIsMobile";
import DeviceCard from "../components/DeviceCard";

export default function DevicesListPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const authUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = authUser?.role === "ADMIN";
  const [types, setTypes] = useState<DeviceType[]>([]);
  const [filterType, setFilterType] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<DeviceSummary | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const confirmDeleteDevice = async () => {
    if (!deviceToDelete) return;
    try {
      await devicesApi.remove(deviceToDelete.id, deviceToDelete.estado === "ASIGNADO");
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setDeleteError(e.message);
    }
    setDeviceToDelete(null);
  };

  const loadSummary = useCallback(() => {
    devicesApi
      .summary()
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

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
          <ITFlex direction="column" gap={0.5}>
            <Link
              to={`/dispositivos/${row.id}`}
              className="text-[12px] font-black text-emerald-700 hover:underline"
            >
              {row.controlActivos}
            </Link>
            {!!row.loteSize && row.loteSize > 1 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700">
                <FaLayerGroup size={9} />
                Lote de {row.loteSize}
              </span>
            )}
          </ITFlex>
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
          <ITFlex direction="column" gap={1}>
            {(row as any).loteCount ? (
              <ITFlex gap={1} wrap="wrap">
                {(row as any).loteCount.disponible > 0 && (
                  <ITBadget color="success" size="small">{`${(row as any).loteCount.disponible} disp.`}</ITBadget>
                )}
                {(row as any).loteCount.asignado > 0 && (
                  <ITBadget color="warning" size="small">{`${(row as any).loteCount.asignado} prest.`}</ITBadget>
                )}
                {(row as any).loteCount.baja > 0 && (
                  <ITBadget color="gray" size="small">{`${(row as any).loteCount.baja} baja`}</ITBadget>
                )}
              </ITFlex>
            ) : (
              <ITBadget
                color={row.estado === "DISPONIBLE" ? "success" : row.estado === "ASIGNADO" ? "warning" : "gray"}
                size="small"
              >
                {row.estado}
              </ITBadget>
            )}
          </ITFlex>
        ),
      },
      {
        type: "string",
        key: "loteSize",
        label: "CANTIDAD",
        sortable: false,
        render: (row: Device) =>
          row.loteSize && row.loteSize > 1 ? (
            <ITFlex align="center" gap={2}>
              <ITText className="text-[14px] font-black text-slate-800">{row.loteSize}</ITText>
              <Link
                to={`/dispositivos/${row.id}/editar`}
                className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 hover:underline"
                title="Editar todo el lote"
              >
                Editar
              </Link>
            </ITFlex>
          ) : (
            <ITText className="text-[10px] font-bold text-slate-300">1</ITText>
          ),
      },
      {
        type: "actions",
        key: "actions",
        label: "",
        align: "right",
        render: (row: Device) => {
          const isLoaned = row.estado === "ASIGNADO";
          return (
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
              <ITButton
                variant="outlined"
                size="small"
                color="secondary"
                onClick={() => !isLoaned && navigate(`/dispositivos/${row.id}/editar`)}
                disabled={isLoaned}
                title={
                  isLoaned
                    ? `Asignado (activo ${row.controlActivos}) — no se puede editar hasta que se devuelva`
                    : "Editar"
                }
              >
                {isLoaned ? <FaLock size={14} /> : <FaEdit size={14} />}
              </ITButton>
              <ITButton
                variant="outlined"
                size="small"
                color="danger"
                onClick={() => setDeviceToDelete(row)}
                disabled={row.estado === "ASIGNADO" && !isAdmin}
                title={
                  row.estado === "ASIGNADO"
                    ? isAdmin
                      ? `Asignado (activo ${row.controlActivos}) — forzar eliminación (solo admin)`
                      : `Asignado (activo ${row.controlActivos}) — registra su devolución antes de dar de baja`
                    : row.estado === "BAJA"
                    ? "Eliminar definitivamente"
                    : "Dar de baja"
                }
              >
                {row.estado === "ASIGNADO" && isAdmin ? (
                  <FaExclamationTriangle size={12} />
                ) : row.estado === "BAJA" ? (
                  <FaTrashRestore size={12} />
                ) : (
                  <FaTrash size={12} />
                )}
              </ITButton>
            </ITFlex>
          );
        },
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
            variant="outlined"
            color="secondary"
            onClick={() => navigate("/dispositivos/importar")}
          >
            <ITFlex align="center" gap={1}>
              <FaFileExcel size={12} />
              <ITText className="font-bold text-[11px]">Cargar Excel</ITText>
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
        <ITGrid item xs={6} md={3}>
          <ITCard className="!p-3 border border-slate-200">
            <ITFlex align="center" gap={2}>
              <ITFlex align="center" justify="center" className="w-9 h-9 shrink-0 rounded-xl bg-slate-100 text-slate-600">
                <FaBoxOpen size={14} />
              </ITFlex>
              <ITFlex direction="column" gap={0}>
                <ITText className="text-[18px] font-black text-slate-800 leading-none">{summary?.total ?? "–"}</ITText>
                <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Total</ITText>
              </ITFlex>
            </ITFlex>
          </ITCard>
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <ITCard
            className="!p-3 border border-slate-200 cursor-pointer hover:border-emerald-300"
            onClick={() => setFilterEstado(filterEstado === "DISPONIBLE" ? "" : "DISPONIBLE")}
          >
            <ITFlex align="center" gap={2}>
              <ITFlex align="center" justify="center" className="w-9 h-9 shrink-0 rounded-xl bg-emerald-50 text-emerald-600">
                <FaCheckCircle size={14} />
              </ITFlex>
              <ITFlex direction="column" gap={0}>
                <ITText className="text-[18px] font-black text-emerald-700 leading-none">{summary?.disponible ?? "–"}</ITText>
                <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Disponible</ITText>
              </ITFlex>
            </ITFlex>
          </ITCard>
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <ITCard
            className="!p-3 border border-slate-200 cursor-pointer hover:border-amber-300"
            onClick={() => setFilterEstado(filterEstado === "ASIGNADO" ? "" : "ASIGNADO")}
          >
            <ITFlex align="center" gap={2}>
              <ITFlex align="center" justify="center" className="w-9 h-9 shrink-0 rounded-xl bg-amber-50 text-amber-600">
                <FaLock size={14} />
              </ITFlex>
              <ITFlex direction="column" gap={0}>
                <ITText className="text-[18px] font-black text-amber-700 leading-none">{summary?.asignado ?? "–"}</ITText>
                <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Asignado</ITText>
              </ITFlex>
            </ITFlex>
          </ITCard>
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <ITCard
            className="!p-3 border border-slate-200 cursor-pointer hover:border-slate-400"
            onClick={() => setFilterEstado(filterEstado === "BAJA" ? "" : "BAJA")}
          >
            <ITFlex align="center" gap={2}>
              <ITFlex align="center" justify="center" className="w-9 h-9 shrink-0 rounded-xl bg-slate-100 text-slate-500">
                <FaTimesCircle size={14} />
              </ITFlex>
              <ITFlex direction="column" gap={0}>
                <ITText className="text-[18px] font-black text-slate-600 leading-none">{summary?.baja ?? "–"}</ITText>
                <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Baja</ITText>
              </ITFlex>
            </ITFlex>
          </ITCard>
        </ITGrid>
      </ITGrid>

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
        reloadTrigger={reloadKey}
      />

      {deleteError && (
        <ITAlert variant="error" dismissible onDismiss={() => setDeleteError(null)}>
          {deleteError}
        </ITAlert>
      )}

      <ITConfirmDialog
        isOpen={!!deviceToDelete}
        onClose={() => setDeviceToDelete(null)}
        onConfirm={confirmDeleteDevice}
        title={
          deviceToDelete?.estado === "ASIGNADO"
            ? "Forzar eliminación (dispositivo asignado)"
            : deviceToDelete?.estado === "BAJA"
            ? "Eliminar definitivamente"
            : "Dar de baja"
        }
        message={
          deviceToDelete?.estado === "ASIGNADO"
            ? `${deviceToDelete?.controlActivos} está actualmente ASIGNADO/prestado. Como administrador puedes forzar su eliminación definitiva: se desvinculará de cartas responsivas y salidas de material relacionadas, y se borrará junto con su historial. Esta acción no se puede deshacer.`
            : deviceToDelete?.estado === "BAJA"
            ? `¿Eliminar definitivamente ${deviceToDelete?.controlActivos}? Se borrarán su historial y movimientos. Esta acción no se puede deshacer.`
            : `¿Dar de baja ${deviceToDelete?.controlActivos}? Quedará con estado "Baja" y podrás eliminarlo definitivamente después.`
        }
        confirmLabel={
          deviceToDelete?.estado === "ASIGNADO"
            ? "Forzar eliminación"
            : deviceToDelete?.estado === "BAJA"
            ? "Eliminar definitivamente"
            : "Dar de baja"
        }
        cancelLabel="Cancelar"
        variant="danger"
      />
    </ITPage>
  );
}