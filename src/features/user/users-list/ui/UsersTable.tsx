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
import type { User } from "@entities/user";
import type { UseUsersList } from "../model/useUsersList";

interface Props {
  fx: UseUsersList;
  onViewHistory: (u: User) => void;
  onEdit: (u: User) => void;
}

const roleBadge = (role: string) => (
  <ITBadget
    color={
      role === "ADMIN"
        ? "danger"
        : role === "GERENTE"
        ? "info"
        : role === "JEFE_DE_AREA"
        ? "warning"
        : "success"
    }
    size="small"
  >
    {role === "JEFE_DE_AREA" ? "JEFE AREA" : role}
  </ITBadget>
);

export default function UsersTable({ fx, onViewHistory, onEdit }: Props) {
  const columns: Column<User>[] = [
    {
      key: "username",
      label: "Username",
      type: "string",
      filter: true,
      sortable: false,
      render: (u) => (
        <ITText className="text-[12px] font-black text-slate-700">@{u.username}</ITText>
      ),
    },
    {
      key: "name",
      label: "Nombre",
      type: "string",
      filter: true,
      sortable: false,
      render: (u) => (
        <ITFlex align="center" gap={1}>
          <ITText className="text-[12px] text-slate-800">{u.name}</ITText>
          {!u.active && (
            <ITBadget color="danger" size="small">inactivo</ITBadget>
          )}
        </ITFlex>
      ),
    },
    {
      key: "role",
      label: "Rol",
      type: "catalog",
      filter: "catalog",
      sortable: false,
      catalogOptions: {
        data: [
          { id: "ADMIN", name: "ADMIN" },
          { id: "GERENTE", name: "GERENTE" },
          { id: "JEFE_DE_AREA", name: "JEFE DE AREA" },
          { id: "EMPLEADO", name: "EMPLEADO" },
        ],
        loading: false,
        error: false,
      },
      render: (u) => roleBadge(u.role),
    },
    {
      key: "numeroEmpleado",
      label: "No. Emp",
      type: "string",
      filter: true,
      sortable: false,
      render: (u) => (
        <ITText className="text-[11px] text-slate-600">{u.numeroEmpleado ?? "—"}</ITText>
      ),
    },
    {
      key: "department",
      label: "Depto",
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
      label: "Subárea",
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
          <ITButton onClick={() => onViewHistory(u)} size="small" color="secondary">
            <FaEye size={14} />
          </ITButton>
          <ITButton onClick={() => onEdit(u)} size="small" color="gray">
            <FaEdit size={14} />
          </ITButton>
          <ITButton
            onClick={() => {
              fx.setUserToPassword(u);
              fx.setNewPassword("");
            }}
            size="small"
            color="success"
          >
            <FaKey size={14} />
          </ITButton>
          <ITButton
            onClick={() => fx.setUserToToggle(u)}
            size="small"
            variant={u.active ? "outlined" : "filled"}
            color={u.active ? "error" : "danger"}
          >
            <FaTrash size={14} />
          </ITButton>
          {!u.active && (
            <ITButton
              onClick={() => fx.setUserToReactivate(u)}
              size="small"
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
      size="sm"
    />
  );
}