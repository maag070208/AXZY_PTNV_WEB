import {
  ITButton,
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaEdit, FaTrash, FaTrashRestore } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { Subarea } from "@entities/subarea";

interface Props {
  fetchData: (
    params: ITDataTableFetchParams
  ) => Promise<ITDataTableResponse<Record<string, unknown>>>;
  reloadKey: number;
  onEdit: (s: Subarea) => void;
  onReactivate: (s: Subarea) => void;
  onDelete: (s: Subarea) => void;
}

export default function SubareasTable({
  fetchData,
  reloadKey,
  onEdit,
  onReactivate,
  onDelete,
}: Props) {
  const { t: tt } = useTranslation(["subareas", "common"]);

  const columns: any[] = [
    {
      type: "string",
      key: "name",
      label: tt("list.colName"),
      sortable: false,
      filter: true,
      render: (s: Subarea) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="font-black text-slate-800 uppercase text-[12px] tracking-tight">
            {s.name}
          </ITText>
          {!s.active && (
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-rose-500 border border-rose-200 rounded-full px-2 py-0.5 w-fit">
              {tt("list.inactive")}
            </ITText>
          )}
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "department",
      label: tt("list.colDepartment"),
      sortable: false,
      render: (s: Subarea) => (
        <ITText className="text-[11px] font-black uppercase tracking-wide text-slate-600">
          {s.department?.name ?? "—"}
        </ITText>
      ),
    },
    {
      type: "actions" as const,
      key: "actions",
      label: "",
      align: "right" as const,
      render: (s: Subarea) => (
        <ITFlex gap={1}>
          {s.active ? (
            <ITButton
              variant="outlined"
              size="lg"
              color="secondary"
              onClick={() => onEdit(s)}
              title={tt("list.editName")}
            >
              <FaEdit size={12} />
            </ITButton>
          ) : (
            <ITButton
              variant="outlined"
              size="lg"
              color="secondary"
              onClick={() => onReactivate(s)}
              title={tt("list.reactivate")}
            >
              <FaTrashRestore size={12} />
            </ITButton>
          )}
          <ITButton
            variant="outlined"
            size="lg"
            color="error"
            onClick={() => onDelete(s)}
            title={s.active ? tt("list.delete") : tt("list.deleteForever")}
          >
            <FaTrash size={12} />
          </ITButton>
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
      itemsPerPageOptions={[50, 100, 150]}
      size="lg"
    />
  );
}
