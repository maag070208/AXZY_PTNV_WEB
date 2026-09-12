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
  isAdmin: boolean;
  onView: (d: Department) => void;
  onEdit: (d: Department) => void;
  onDelete: (d: Department) => void;
}

export default function DepartmentsTable({
  fetchData,
  reloadKey,
  isAdmin,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const { t: tt } = useTranslation("common");

  const columns: any[] = [
    {
      type: "string",
      key: "name",
      label: "DEPARTAMENTO",
      sortable: false,
      filter: true,
      render: (d: Department) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="font-black text-slate-800 uppercase text-[12px] tracking-tight">
            {d.name}
          </ITText>
          {!d.active && (
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-rose-500 border border-rose-200 rounded-full px-2 py-0.5 w-fit">
              inactivo
            </ITText>
          )}
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "subareas",
      label: "ÁREAS",
      render: (d: Department) =>
        d.subareas.length === 0 ? (
          <ITText className="text-[10px] font-bold text-slate-400 uppercase">
            Sin áreas
          </ITText>
        ) : (
          <ITFlex wrap="wrap" gap={1}>
            {d.subareas.map((s: Subarea) => (
              <ITBadget key={s.id} color="primary" size="small">
                {s.name.toUpperCase()}
              </ITBadget>
            ))}
          </ITFlex>
        ),
    },
    {
      type: "number",
      key: "count",
      label: "USUARIOS",
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
      align: "right" as const,
      render: (d: Department) => (
        <ITFlex gap={1}>
          <ITButton
            variant="outlined"
            size="small"
            color="secondary"
            onClick={() => onView(d)}
            title={tt("actions.view")}
          >
            <FaEye size={14} />
          </ITButton>
          {isAdmin && (
            <ITButton
              variant="outlined"
              size="small"
              color="secondary"
              onClick={() => onEdit(d)}
              title="Editar nombre"
            >
              <FaEdit size={12} />
            </ITButton>
          )}
          {isAdmin && (
            <ITButton
              variant="outlined"
              size="small"
              color="danger"
              onClick={() => onDelete(d)}
              title="Eliminar departamento"
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