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
import type { PersonalProfile } from "@entities/hr";
import { roleLabel } from "@entities/user";

const roleBadge = (role: string, label: string) => (
  <ITBadget
    color={
      role === "MANAGER"
        ? "danger"
        : role === "AREA_HEAD"
        ? "warning"
        : role === "EMPLOYEE"
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
  canEdit: boolean;
  fetchData: (
    params: ITDataTableFetchParams
  ) => Promise<ITDataTableResponse<Record<string, unknown>>>;
  reloadKey: number;
  onView: (u: PersonalProfile) => void;
  onEdit: (u: PersonalProfile) => void;
}

export default function EmployeesTable({
  departments,
  canEdit,
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

  // Roles que admite el API para el personal (PERSONAL_ROLES).
  const roleOptions = (["MANAGER", "AREA_HEAD", "EMPLOYEE"] as const).map((id) => ({
    id,
    name: roleLabel(id),
  }));

  const columns: Column<PersonalProfile>[] = [
    {
      key: "employeeNumber",
      label: tt("table.employeeNoFull"),
      type: "string",
      width: 110,
      filter: true,
      sortable: false,
      render: (u) => (
        <ITText className="text-[11px] font-black text-slate-700">
          {u.employeeNumber ?? "—"}
        </ITText>
      ),
    },
    {
      key: "name",
      label: tt("table.name"),
      type: "string",
      width: 300,
      filter: true,
      sortable: false,
      render: (u) => (
        <ITFlex
          direction="column"
          gap={0.5}
          className="cursor-pointer"
        >
          <ITText className="text-[12px] font-black text-slate-800">{u.name}</ITText>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            @{u.username}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "role",
      label: tt("table.role"),
      type: "catalog",
      width: 140,
      filter: "catalog",
      sortable: false,
      catalogOptions: { data: roleOptions, loading: false, error: false },
      render: (u) => roleBadge(u.role, roleLabel(u.role)),
    },
    {
      key: "active",
      label: tt("table.status"),
      type: "boolean" as const,
      width: 140,
      filter: "catalog",
      catalogOptions: {
        data: [
          { id: "true", name: tt("table.statusActive") },
          { id: "false", name: tt("table.statusInactive") },
        ],
        loading: false,
        error: false,
      },
      render: (u) => (
        <ITBadget color={u.active ? "success" : "danger"} size="lg">
          {u.active ? tt("table.statusActive") : tt("table.statusInactive")}
        </ITBadget>
      ),
    },
    {
      key: "jobTitle",
      label: tt("table.position"),
      type: "string",
      width: 220,
      filter: true,
      sortable: false,
      render: (u) => (
        <ITText className="text-[11px] font-bold text-slate-600">{u.jobTitle ?? "—"}</ITText>
      ),
    },
    {
      key: "departmentId",
      label: tt("table.departmentFull"),
      type: "catalog",
      width: 200,
      filter: "catalog",
      catalogOptions: { data: departmentOptions, loading: false, error: false },
      render: (u) => (
        <ITText className="text-[10px] font-black text-slate-600 uppercase">
          {u.department?.name ?? "—"}
        </ITText>
      ),
    },
    {
      key: "subareaId",
      label: tt("table.subarea"),
      type: "catalog",
      width: 200,
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
      width: 120,
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
          {canEdit && (
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
      defaultItemsPerPage={100}
      itemsPerPageOptions={[50, 100, 150]}
      size="lg"
      virtualized
      virtualizedMaxHeight={420}
      rowHeight={50}
      onRowClick={(row) => onView(row as unknown as PersonalProfile)}
    />
  );
}