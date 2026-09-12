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
import { FaPen, FaPlus, FaTag, FaMicrochip } from "react-icons/fa";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { deviceTypeApi as deviceTypesApi, type DeviceType } from "@entities/device-type";

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
      label: "TIPO",
      sortable: false,
      filter: true,
      render: (t: DeviceType) => (
        <ITFlex align="center" gap={1.25}>
          <ITFlex
            align="center"
            justify="center"
            className={`w-11 h-11 rounded-2xl text-white font-black text-[13px] shrink-0 shadow-sm ${
              t.active
                ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                : "bg-gradient-to-br from-slate-300 to-slate-400"
            }`}
          >
            {t.prefix}
          </ITFlex>
          <ITFlex direction="column" gap={0.25}>
            <ITFlex align="center" gap={0.5}>
              <ITText className="font-black text-slate-800 text-[13px] uppercase leading-tight">
                {t.name}
              </ITText>
              {!t.active && (
                <ITText
                  as="span"
                  className="text-[9px] font-bold uppercase text-rose-500 bg-rose-50 border border-rose-200 rounded-full px-2 py-0.5 leading-none"
                >
                  Inactivo
                </ITText>
              )}
            </ITFlex>
            <ITText className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Código {t.code}
            </ITText>
          </ITFlex>
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "next",
      label: "SIGUIENTE FOLIO",
      render: (t: DeviceType) => (
        <ITFlex
          align="center"
          justify="center"
          className="inline-flex bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 w-fit"
        >
          <ITText className="text-[11px] font-black text-slate-600 font-mono tracking-tight">
            {t.prefix}-{String(t.contador + 1).padStart(4, "0")}
          </ITText>
        </ITFlex>
      ),
    },
    {
      type: "number",
      key: "count",
      label: "DISPOSITIVOS",
      render: (t: DeviceType) => (
        <ITFlex align="center" gap={0.5}>
          <FaMicrochip size={11} className="text-slate-400" />
          <ITText className="text-[12px] font-black text-slate-700">
            {t._count?.devices ?? 0}
          </ITText>
        </ITFlex>
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
          <FaPen size={12} />
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
       maxWidth="7xl"
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
