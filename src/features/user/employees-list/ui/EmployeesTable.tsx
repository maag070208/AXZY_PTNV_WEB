import {
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaEdit } from "react-icons/fa";
import type { Department } from "@entities/department";
import type { User } from "@entities/user";

interface Props {
  departments: Department[];
  isAdmin: boolean;
  fetchData: (
    params: ITDataTableFetchParams
  ) => Promise<ITDataTableResponse<Record<string, unknown>>>;
  reloadKey: number;
  onEdit: (u: User) => void;
}

export default function EmployeesTable({
  departments,
  isAdmin,
  fetchData,
  reloadKey,
  onEdit,
}: Props) {
  const departmentOptions = departments
    .filter((d) => d.active)
    .map((d) => ({ id: d.id, name: d.name }));

  const subareaOptions = departments
    .filter((d) => d.active)
    .flatMap((d) =>
      d.subareas.map((s) => ({ id: s.id, name: `${d.name} · ${s.name}` }))
    );

  const columns: Column<User>[] = [
    {
      key: "numeroEmpleado",
      label: "No. Empleado",
      type: "string",
      filter: true,
      sortable: false,
      render: (u) => (
        <ITText className="text-[11px] font-black text-slate-700">
          {u.numeroEmpleado ?? "—"}
        </ITText>
      ),
    },
    {
      key: "name",
      label: "Nombre",
      type: "string",
      filter: true,
      sortable: false,
      render: (u) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[12px] font-black text-slate-800">{u.name}</ITText>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            @{u.username}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "puesto",
      label: "Puesto",
      type: "string",
      filter: true,
      sortable: false,
      render: (u) => (
        <ITText className="text-[11px] font-bold text-slate-600">{u.puesto ?? "—"}</ITText>
      ),
    },
    {
      key: "department",
      label: "Departamento",
      type: "catalog",
      filter: "catalog",
      catalogOptions: { data: departmentOptions, loading: false, error: false },
      render: (u) => (
        <ITText className="text-[10px] font-black text-slate-600 uppercase">
          {(u as any).department?.name ?? "—"}
        </ITText>
      ),
    },
    {
      key: "subarea",
      label: "Subárea",
      type: "catalog",
      filter: "catalog",
      catalogOptions: { data: subareaOptions, loading: false, error: false },
      render: (u) => (
        <ITText className="text-[10px] font-bold text-slate-500 uppercase">
          {(u as any).subarea?.name ?? "—"}
        </ITText>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: "actions",
            label: "",
            type: "string" as const,
            sortable: false,
            render: (u: User) => (
              <FaEdit
                size={14}
                className="text-slate-400 hover:text-blue-600 cursor-pointer"
                onClick={() => onEdit(u)}
                title="Editar empleado"
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <ITDataTable
      columns={columns as unknown as Column<Record<string, unknown>>[]}
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