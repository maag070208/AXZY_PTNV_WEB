import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaEdit, FaUserTie } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { Department } from "@entities/department";
import type { PersonalProfile } from "@entities/personal";

const ROLE_LABEL: Record<string, string> = {
  GERENTE: "GERENTE",
  JEFE_DE_AREA: "JEFE DE ÁREA",
  EMPLEADO: "EMPLEADO",
};

const roleBadge = (role: string, label: string) => (
  <ITBadget
    color={
      role === "GERENTE"
        ? "danger"
        : role === "JEFE_DE_AREA"
        ? "warning"
        : role === "EMPLEADO"
        ? "success"
        : "gray"
    }
    size="lg"
  >
    {label}
  </ITBadget>
);

interface Props {
  departments: Department[];
  isAdmin: boolean;
  fetchData: (
    params: ITDataTableFetchParams
  ) => Promise<ITDataTableResponse<Record<string, unknown>>>;
  reloadKey: number;
  onView: (u: PersonalProfile) => void;
  onEdit: (u: PersonalProfile) => void;
}

export default function EmployeesTable({
  departments,
  isAdmin,
  fetchData,
  reloadKey,
  onView,
  onEdit,
}: Props) {
  const { t: tt } = useTranslation(["users"]);
  const departmentOptions = departments
    .filter((d) => d.active)
    .map((d) => ({ id: d.id, name: d.name }));

  const subareaOptions = departments
    .filter((d) => d.active)
    .flatMap((d) =>
      d.subareas.map((s) => ({ id: s.id, name: `${d.name} · ${s.name}` }))
    );

  const columns: Column<PersonalProfile>[] = [
    {
      key: "numeroEmpleado",
      label: tt("table.employeeNoFull"),
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
      label: tt("table.name"),
      type: "string",
      filter: true,
      sortable: false,
      render: (u) => (
        <ITFlex
          direction="column"
          gap={0.5}
          className="cursor-pointer"
          onClick={() => onView(u)}
        >
          <ITText className="text-[12px] font-black text-slate-800 hover:text-blue-600">{u.name}</ITText>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            @{u.username}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "role",
      label: tt("table.role"),
      type: "string",
      filter: false,
      sortable: false,
      render: (u) => roleBadge(u.role, ROLE_LABEL[u.role] ?? u.role),
    },
    {
      key: "puesto",
      label: tt("table.position"),
      type: "string",
      filter: true,
      sortable: false,
      render: (u) => (
        <ITText className="text-[11px] font-bold text-slate-600">{u.puesto ?? "—"}</ITText>
      ),
    },
    {
      key: "department",
      label: tt("table.departmentFull"),
      type: "catalog",
      filter: "catalog",
      catalogOptions: { data: departmentOptions, loading: false, error: false },
      render: (u) => (
        <ITText className="text-[10px] font-black text-slate-600 uppercase">
          {u.department?.name ?? "—"}
        </ITText>
      ),
    },
    {
      key: "subarea",
      label: tt("table.subarea"),
      type: "catalog",
      filter: "catalog",
      catalogOptions: { data: subareaOptions, loading: false, error: false },
      render: (u) => (
        <ITText className="text-[10px] font-bold text-slate-500 uppercase">
          {u.subarea?.name ?? "—"}
        </ITText>
      ),
    },
    {
      key: "actions",
      label: "",
      type: "string" as const,
      sortable: false,
      render: (u: PersonalProfile) => (
        <ITFlex align="center" gap={2}>
          <ITButton
            onClick={() => onView(u)}
            size="lg"
            color="secondary"
            title={tt("table.viewProfile")}
          >
            <FaUserTie size={14} />
          </ITButton>
          {isAdmin && (
            <ITButton
              onClick={() => onEdit(u)}
              size="lg"
              color="gray"
              title={tt("table.editEmployee")}
            >
              <FaEdit size={14} />
            </ITButton>
          )}
        </ITFlex>
      ),
    },
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
      itemsPerPageOptions={[5, 10, 50]}
      size="lg"
    />
  );
}