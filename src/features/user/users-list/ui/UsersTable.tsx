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
  const columns: Column<User>[] = [
    {
      key: "username",
      label: tt("table.username"),
      type: "string",
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
      filter: true,
      sortable: false,
      render: (u) => (
        <ITFlex align="center" gap={1}>
          <ITText className="text-[12px] text-slate-800">{u.name}</ITText>
          {!u.active && (
            <ITBadget color="danger" size="lg">inactivo</ITBadget>
          )}
        </ITFlex>
      ),
    },
    {
      key: "role",
      label: tt("table.role"),
      type: "catalog",
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
      filter: "catalog",
      catalogOptions: { data: [], loading: false, error: false },
      render: (u) => (
        <ITText className="text-[10px] uppercase text-slate-500">
          {(u as any).department?.name ?? "—"}
        </ITText>
      ),
    },
    {
      key: "subarea",
      label: tt("table.subarea"),
      type: "catalog",
      filter: "catalog",
      catalogOptions: { data: [], loading: false, error: false },
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
      defaultItemsPerPage={10}
      itemsPerPageOptions={[5, 10, 50]}
      size="lg"
    />
  );
}