import {
  ITButton,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import { FaMicrochip, FaPen } from "react-icons/fa";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deviceTypeApi as deviceTypesApi,
  type DeviceType,
} from "@entities/device-type";
import { i18n } from "@shared/i18n";
import { Avatar } from "@shared/ui/kanban";

export interface DeviceTypesStats {
  types: number;
  active: number;
  inactive: number;
  devices: number;
  loading: boolean;
}

export const useDeviceTypesList = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DeviceTypesStats>({
    types: 0,
    active: 0,
    inactive: 0,
    devices: 0,
    loading: true,
  });

  useEffect(() => {
    deviceTypesApi
      .list(true)
      .then((list) =>
        setStats({
          types: list.length,
          active: list.filter((t) => t.active).length,
          inactive: list.filter((t) => !t.active).length,
          devices: list.reduce((acc, t) => acc + (t._count?.devices ?? 0), 0),
          loading: false,
        })
      )
      .catch(() => setStats((s) => ({ ...s, loading: false })));
  }, []);

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

  return { navigate, stats, fetchTableData };
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
        <Avatar
          name={t.name}
          seed={t.prefix}
          size={8}
        />
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
      <ITFlex
        align="center"
        gap={1}
        className={`inline-flex rounded-lg px-2.5 py-1 w-fit border ${(t._count?.devices ?? 0) > 0
            ? "bg-indigo-50 border-indigo-200"
            : "bg-slate-50 border-slate-200"
          }`}
      >
        <FaMicrochip
          size={11}
          className={
            (t._count?.devices ?? 0) > 0 ? "text-indigo-500" : "text-slate-400"
          }
        />
        <ITText
          className={`text-[12px] font-black ${(t._count?.devices ?? 0) > 0 ? "text-indigo-700" : "text-slate-700"
            }`}
        >
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
        size="sm"
        color="secondary"
        onClick={() => navigate(`/dispositivos/tipos/${t.id}/editar`)}
        title={i18n.t("device-types:list.edit")}
      >
        <FaPen size={12} />
      </ITButton>
    ),
  },
];