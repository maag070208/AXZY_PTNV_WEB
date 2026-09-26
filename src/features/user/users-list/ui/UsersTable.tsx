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
import { FaEdit, FaEye, FaKey, FaTrash, FaUndo } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { USER_ROLES, roleLabel, type User } from "@entities/user";
import type { UseUsersList } from "../model/useUsersList";
import { i18n } from "@shared/i18n";

interface Props {
  fx: UseUsersList;
  onView: (u: User) => void;
  onEdit: (u: User) => void;
}

const roleBadge = (role: string) => (
  <ITBadget
    color={
      role === "ADMIN"
        ? "danger"
        : role === "MANAGER"
        ? "info"
        : role === "AREA_HEAD"
        ? "warning"
        : role === "GUARD"
        ? "gray"
        : "success"
    }
    size="lg"
  >
    {roleLabel(role)}
  </ITBadget>
);

export default function UsersTable({ fx, onView, onEdit }: Props) {
  const { t: tt } = useTranslation(["users", "common"]);

  const departmentOptions = fx.departments
    .filter((d) => d.active)
    .map((d) => ({ id: d.id, name: d.name }));

  const subareaOptions = fx.departments
    .filter((d) => d.active)
    .flatMap((d) => d.subareas.map((s) => ({ id: s.id, name: `${d.name} · ${s.name}` })));

  const columns: Column<User>[] = [
    {
      key: "username",
      label: tt("table.username"),
      type: "string",
      width: 110,
      filter: true,
      sortable: false,
      render: (u) => (
        <ITText className="text-[12px] font-black text-slate-700">@{u.username}</ITText>
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
        <ITFlex align="center" gap={1}>
          <ITText className="text-[12px] text-slate-800">{u.name}</ITText>
          {!u.active && (
            <ITBadget color="danger" size="lg">{i18n.t("common:labels.inactive")}</ITBadget>
          )}
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
      catalogOptions: {
        data: USER_ROLES.map((id) => ({ id, name: roleLabel(id) })),
        loading: false,
        error: false,
      },
      render: (u) => roleBadge(u.role),
    },
    {
      key: "employeeNumber",
      label: tt("table.employeeNo"),
      type: "string",
      width: 110,
      filter: true,
      sortable: false,
      render: (u) => (
        <ITText className="text-[11px] text-slate-600">{u.employeeNumber ?? "—"}</ITText>
      ),
    },
    {
      key: "department",
      label: tt("table.department"),
      type: "catalog",
      width: 200,
      filter: "catalog",
      catalogOptions: { data: departmentOptions, loading: false, error: false },
      render: (u) => (
        <ITText className="text-[10px] uppercase text-slate-500">
          {(u as any).department?.name ?? "—"}
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
        <ITText className="text-[10px] uppercase text-slate-500">
          {(u as any).subarea?.name ?? "—"}
        </ITText>
      ),
    },
    {
      key: "actions",
      label: "",
      type: "string",
      width: 200,
      sortable: false,
      render: (u) => (
        <ITFlex align="center" gap={2}>
          <ITButton
            onClick={() => onView(u)}
            size="lg"
            color="secondary"
            title={tt("common:actions.view")}
          >
            <FaEye size={14} />
          </ITButton>
          <ITButton onClick={() => onEdit(u)} size="lg" color="gray">
            <FaEdit size={14} />
          </ITButton>
          <ITButton
            onClick={() => {
              fx.setUserToPassword(u);
              fx.setNewPassword("");
            }}
            size="lg"
            color="success"
          >
            <FaKey size={14} />
          </ITButton>
          <ITButton
            onClick={() => fx.setUserToToggle(u)}
            size="lg"
            variant={u.active ? "outlined" : "filled"}
            color={u.active ? "error" : "danger"}
          >
            <FaTrash size={14} />
          </ITButton>
          {!u.active && (
            <ITButton
              onClick={() => fx.setUserToReactivate(u)}
              size="lg"
              color="success"
            >
              <FaUndo size={14} />
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
        fx.fetchTableData as unknown as (
          p: ITDataTableFetchParams
        ) => Promise<ITDataTableResponse<Record<string, unknown>>>
      }
      reloadTrigger={fx.reloadKey}
      defaultItemsPerPage={100}
      itemsPerPageOptions={[50, 100, 150]}
      size="lg"
      virtualized
      virtualizedMaxHeight={420}
      rowHeight={50}
      onRowClick={(row) => onView(row as unknown as User)}
    />
  );
}