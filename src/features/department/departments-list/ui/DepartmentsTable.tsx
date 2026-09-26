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
import type { Department, Subarea } from "@entities/department";

interface Props {
  fetchData: (
    params: ITDataTableFetchParams
  ) => Promise<ITDataTableResponse<Record<string, unknown>>>;
  reloadKey: number;
  canManage: boolean;
  onView: (d: Department) => void;
  onEdit: (d: Department) => void;
  onDelete: (d: Department) => void;
}

export default function DepartmentsTable({
  fetchData,
  reloadKey,
  canManage,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const { t: tt } = useTranslation(["departments", "common"]);

  const columns: any[] = [
    {
      type: "string",
      key: "name",
      label: tt("list.colDepartment"),
      width: 240,
      sortable: false,
      filter: true,
      render: (d: Department) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="font-black text-slate-800 uppercase text-[12px] tracking-tight">
            {d.name}
          </ITText>
          {!d.active && (
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-rose-500 border border-rose-200 rounded-full px-2 py-0.5 w-fit">
              {tt("list.inactive")}
            </ITText>
          )}
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "subareas",
      label: tt("list.colAreas"),
      width: 200,
      render: (d: Department) =>
        d.subareas.length === 0 ? (
          <ITText className="text-[10px] font-bold text-slate-400 uppercase">
            {tt("list.noAreas")}
          </ITText>
        ) : (
          <ITFlex wrap="wrap" gap={1}>
            {d.subareas.map((s: Subarea) => (
              <ITBadget key={s.id} color="primary" size="lg">
                {s.name.toUpperCase()}
              </ITBadget>
            ))}
          </ITFlex>
        ),
    },
    {
      type: "number",
      key: "count",
      label: tt("list.colUsers"),
      width: 100,
      render: (d: Department) => (
        <ITText className="text-[11px] font-black text-slate-600">
          {d._count?.users ?? 0}
        </ITText>
      ),
    },
    {
      type: "actions" as const,
      key: "actions",
      label: "",
      width: 140,
      align: "right" as const,
      render: (d: Department) => (
        <ITFlex gap={1}>
          <ITButton
            variant="outlined"
            size="lg"
            color="secondary"
            onClick={() => onView(d)}
            title={tt("common:actions.view")}
          >
            <FaEye size={14} />
          </ITButton>
          {canManage && (
            <ITButton
              variant="outlined"
              size="lg"
              color="secondary"
              onClick={() => onEdit(d)}
              title={tt("list.editName")}
            >
              <FaEdit size={12} />
            </ITButton>
          )}
          {canManage && (
            <ITButton
              variant="outlined"
              size="lg"
              color="error"
              onClick={() => onDelete(d)}
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
      defaultItemsPerPage={100}
      itemsPerPageOptions={[50, 100, 150]}
      size="lg"
      virtualized
      virtualizedMaxHeight={420}
      rowHeight={50}
      onRowClick={(row) => onView(row as unknown as Department)}
    />
  );
}