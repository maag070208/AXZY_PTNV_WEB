import {
  ITButton,
  ITDataTable,
  ITFlex,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaEye, FaPlus, FaTag } from "react-icons/fa";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { deviceTypesApi, type DeviceType } from "@core/api/devices.api";

export default function DeviceTypesListPage() {
  const navigate = useNavigate();

  const fetchTableData = useCallback(
    async (params: ITDataTableFetchParams) => {
      const res = await deviceTypesApi.table({
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

  const columns: any[] = [
    {
      type: "string",
      key: "prefix",
      label: "PREFIJO",
      sortable: false,
      filter: true,
      render: (t: DeviceType) => (
        <ITFlex
          align="center"
          justify="center"
          className="w-12 h-12 rounded-xl bg-emerald-500 text-white font-black text-[14px]"
        >
          {t.prefix}
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "name",
      label: "NOMBRE",
      sortable: false,
      filter: true,
      render: (t: DeviceType) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="font-black text-slate-800 text-[13px] uppercase">
            {t.name}
            {!t.active && (
              <ITText
                as="span"
                className="ml-2 text-[9px] font-bold uppercase text-rose-500 border border-rose-200 rounded-full px-2 py-0.5"
              >
                inactivo
              </ITText>
            )}
          </ITText>
          <ITText className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Código {t.code}
          </ITText>
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "next",
      label: "SIGUIENTE",
      render: (t: DeviceType) => (
        <ITText className="text-[11px] font-black text-slate-700">
          {t.prefix}-{String(t.contador + 1).padStart(4, "0")}
        </ITText>
      ),
    },
    {
      type: "number",
      key: "count",
      label: "DISPOSITIVOS",
      render: (t: DeviceType) => (
        <ITText className="text-[11px] font-black text-slate-600">
          {t._count?.devices ?? 0}
        </ITText>
      ),
    },
    {
      type: "actions",
      key: "actions",
      label: "",
      align: "right",
      render: (t: DeviceType) => (
        <ITButton
          variant="outlined"
          size="small"
          color="secondary"
          onClick={() => navigate(`/dispositivos/tipos/${t.id}/editar`)}
          title="Editar"
        >
          <FaEye size={14} />
        </ITButton>
      ),
    },
  ];

  return (
    <ITPage
      title="Tipos de dispositivo"
      description="Cada tipo tiene su propio consecutivo (prefijo)"
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: "Dispositivos", onClick: () => navigate("/dispositivos") },
        { label: "Tipos" },
      ]}
      actions={
        <ITButton
          variant="filled"
          color="primary"
          onClick={() => navigate("/dispositivos/tipos/nuevo")}
        >
          <ITFlex align="center" gap={1}>
            <FaPlus size={12} />
            <ITText className="font-bold text-[11px]">Nuevo tipo</ITText>
          </ITFlex>
        </ITButton>
      }
      icon={<FaTag size={20} />}
      maxWidth="4xl"
    >
      <ITDataTable
        columns={columns as any}
        fetchData={
          fetchTableData as unknown as (
            p: ITDataTableFetchParams
          ) => Promise<ITDataTableResponse<Record<string, unknown>>>
        }
        defaultView="table"
        defaultItemsPerPage={10}
        size="sm"
      />
    </ITPage>
  );
}