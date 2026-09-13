import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { Location, Sublugar } from "@entities/location";

interface Props {
  fetchData: (
    params: ITDataTableFetchParams
  ) => Promise<ITDataTableResponse<Record<string, unknown>>>;
  reloadKey: number;
  isAdmin: boolean;
  onView: (loc: Location) => void;
  onEdit: (loc: Location) => void;
  onDelete: (loc: Location) => void;
}

export default function LocationsTable({
  fetchData,
  reloadKey,
  isAdmin,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const { t: tt } = useTranslation(["locations", "common"]);

  const columns: any[] = [
    {
      type: "string",
      key: "lugar",
      label: tt("list.colLocation"),
      sortable: false,
      filter: true,
      render: (loc: Location) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="font-black text-slate-800 uppercase text-[12px] tracking-tight">
            {loc.lugar}
          </ITText>
          {loc.active === false && (
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-rose-500 border border-rose-200 rounded-full px-2 py-0.5 w-fit">
              {tt("list.inactive")}
            </ITText>
          )}
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "sublugares",
      label: tt("list.colAreas"),
      render: (loc: Location) =>
        !loc.sublugares?.length ? (
          <ITText className="text-[10px] font-bold text-slate-400 uppercase">
            {tt("list.noAreas")}
          </ITText>
        ) : (
          <ITFlex wrap="wrap" gap={1}>
            {loc.sublugares.map((s: Sublugar) => (
              <ITBadget key={s.id} color="primary" size="small">
                {s.name.toUpperCase()}
              </ITBadget>
            ))}
          </ITFlex>
        ),
    },
    {
      type: "number",
      key: "devices",
      label: tt("list.colDevices"),
      render: (loc: Location) => (
        <ITText className="text-[11px] font-black text-slate-600">
          {loc._count?.devices ?? 0}
        </ITText>
      ),
    },
    {
      type: "number",
      key: "cartas",
      label: tt("list.colCartas"),
      render: (loc: Location) => (
        <ITText className="text-[11px] font-black text-slate-600">
          {loc._count?.cartas ?? 0}
        </ITText>
      ),
    },
    {
      type: "actions" as const,
      key: "actions",
      label: "",
      align: "right" as const,
      render: (loc: Location) => (
        <ITFlex gap={1}>
          <ITButton
            variant="outlined"
            size="small"
            color="secondary"
            onClick={() => onView(loc)}
            title={tt("common:actions.view")}
          >
            <FaEye size={14} />
          </ITButton>
          {isAdmin && (
            <ITButton
              variant="outlined"
              size="small"
              color="secondary"
              onClick={() => onEdit(loc)}
              title={tt("list.editName")}
            >
              <FaEdit size={12} />
            </ITButton>
          )}
          {isAdmin && (
            <ITButton
              variant="outlined"
              size="small"
              color="danger"
              onClick={() => onDelete(loc)}
              title={tt("list.delete")}
            >
              <FaTrash size={12} />
            </ITButton>
          )}
        </ITFlex>
      ),
    },
  ];

  return (
    <ITDataTable
      columns={columns as any}
      fetchData={
        fetchData as unknown as (
          p: ITDataTableFetchParams
        ) => Promise<ITDataTableResponse<Record<string, unknown>>>
      }
      reloadTrigger={reloadKey}
      defaultItemsPerPage={10}
      size="sm"
    />
  );
}