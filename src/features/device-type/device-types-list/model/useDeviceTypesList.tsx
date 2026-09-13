import {
  ITButton,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import { FaMicrochip, FaPen } from "react-icons/fa";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  deviceTypeApi as deviceTypesApi,
  type DeviceType,
} from "@entities/device-type";
import { i18n } from "@shared/i18n";

export const useDeviceTypesList = () => {
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

  return { navigate, fetchTableData };
};

export type UseDeviceTypesList = ReturnType<typeof useDeviceTypesList>;

export const deviceTypesColumns = (navigate: ReturnType<typeof useNavigate>) => [
  {
    type: "string",
    key: "prefix",
    label: i18n.t("device-types:list.colTipo"),
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
                {i18n.t("device-types:list.inactive")}
              </ITText>
            )}
          </ITFlex>
          <ITText className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {i18n.t("device-types:list.code")} {t.code}
          </ITText>
        </ITFlex>
      </ITFlex>
    ),
  },
  {
    type: "string",
    key: "next",
    label: i18n.t("device-types:list.colFolio"),
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
    label: i18n.t("device-types:list.colCount"),
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
        title={i18n.t("device-types:list.edit")}
      >
        <FaPen size={12} />
      </ITButton>
    ),
  },
];