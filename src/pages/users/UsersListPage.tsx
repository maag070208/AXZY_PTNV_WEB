import {
  ITBadget,
  ITButton,
  ITConfirmDialog,
  ITDataTable,
  ITDialog,
  ITFlex,
  ITInput,
  ITPage,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaEdit, FaEye, FaFileExcel, FaKey, FaPlus, FaTrash, FaUndo, FaUserShield } from "react-icons/fa";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { RootState } from "@core/store/store";
import { usersApi, type User } from "@entities/user";

export default function UsersListPage() {
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["users", "common"]);
  const authUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = authUser?.role === "ADMIN";
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [userToReactivate, setUserToReactivate] = useState<User | null>(null);
  const [userToForceDelete, setUserToForceDelete] = useState<User | null>(null);
  const [userToPassword, setUserToPassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const fetchTableData = useCallback(
    async (params: ITDataTableFetchParams) => {
      const res = await usersApi.table({
        page: params.page,
        limit: params.limit,
        filters: params.filters as Record<string, string | number | boolean>,
        sort: params.sort,
      });
      setTotal(res.total);
      return {
        data: res.data as unknown as Record<string, unknown>[],
        total: res.total,
      };
    },
    []
  );

  const handleToggleActive = async () => {
    if (!userToToggle) return;
    const target = userToToggle;
    setUserToToggle(null);
    try {
      const res = await usersApi.delete(target.id);
      setReloadKey((k) => k + 1);
      setToast({
        message: res.soft ? tt("list.toastDeactivated") : tt("list.toastDeleted"),
        type: "success",
      });
    } catch (e: any) {
      if (isAdmin && !target.active) {
        setUserToForceDelete(target);
      } else {
        setToast({ message: e.message || tt("list.errorDeactivate"), type: "error" });
      }
    }
  };

  const handleReactivate = async () => {
    if (!userToReactivate) return;
    const target = userToReactivate;
    setUserToReactivate(null);
    try {
      await usersApi.update(target.id, { active: true });
      setReloadKey((k) => k + 1);
      setToast({ message: tt("list.toastReactivated"), type: "success" });
    } catch (e: any) {
      setToast({ message: e.message || tt("list.errorReactivate"), type: "error" });
    }
  };

  const handleForceDelete = async () => {
    if (!userToForceDelete) return;
    setUserToForceDelete(null);
    try {
      await usersApi.delete(userToForceDelete.id, true);
      setReloadKey((k) => k + 1);
      setToast({ message: tt("list.toastDeleted"), type: "success" });
    } catch (e: any) {
      setToast({ message: e.message || tt("list.errorForceDelete"), type: "error" });
    }
  };

  const handleChangePassword = async () => {
    if (!userToPassword || !newPassword.trim()) return;
    try {
      await usersApi.changePassword(userToPassword.id, newPassword);
      setUserToPassword(null);
      setNewPassword("");
      setToast({ message: tt("list.toastPasswordChanged"), type: "success" });
    } catch (e: any) {
      setToast({ message: e.message || tt("list.errorPassword"), type: "error" });
    }
  };

  const roleBadge = (role: string) => (
    <ITBadget
      color={role === "ADMIN" ? "danger" : role === "GERENTE" ? "info" : role === "JEFE_DE_AREA" ? "warning" : "success"}
      size="small"
    >
      {role === "JEFE_DE_AREA" ? "JEFE AREA" : role}
    </ITBadget>
  );

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
      catalogOptions: {
        data: [],
        loading: false,
        error: false,
      },
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
      catalogOptions: {
        data: [],
        loading: false,
        error: false,
      },
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
            onClick={() => navigate(`/usuarios/${u.id}/historial`)}
            size="small"
            color="secondary"
          >
            <FaEye size={14} />
          </ITButton>
          <ITButton
            onClick={() => navigate(`/usuarios/${u.id}/editar`)}
            size="small"
            color="gray"
          >
            <FaEdit size={14} />
          </ITButton>
          <ITButton
            onClick={() => {
              setUserToPassword(u);
              setNewPassword("");
            }}
            size="small"
            color="success"

          >
            <FaKey size={14} />
          </ITButton>
          <ITButton
            onClick={() => setUserToToggle(u)}
            size="small"
            variant={u.active ? "outlined" : "filled"}
            color={u.active ? "error" : "danger"}
          >
            <FaTrash size={14} />
          </ITButton>
          {!u.active && (
            <ITButton
              onClick={() => setUserToReactivate(u)}
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
    <ITPage
      title={tt("list.title")}
      description={tt("list.description", { count: total })}
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: tt("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: tt("list.breadcrumb") },
      ]}
      actions={
        <ITFlex gap={2}>
          <ITButton
            variant="outlined"
            color="secondary"
            onClick={() => navigate("/usuarios/importar")}
          >
            <ITFlex align="center" gap={1}>
              <FaFileExcel size={12} />
              <ITText className="font-bold text-[11px]">{tt("list.importExcel")}</ITText>
            </ITFlex>
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            onClick={() => navigate("/usuarios/nuevo")}
          >
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">{tt("list.new")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
      icon={<FaUserShield size={20} />}
    >
      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={
          fetchTableData as unknown as (
            p: ITDataTableFetchParams
          ) => Promise<ITDataTableResponse<Record<string, unknown>>>
        }
        reloadTrigger={reloadKey}
        defaultItemsPerPage={10}
        size="sm"
      />

      <ITConfirmDialog
        isOpen={!!userToToggle}
        onClose={() => setUserToToggle(null)}
        onConfirm={handleToggleActive}
        title={userToToggle?.active ? tt("list.confirmDeactivateTitle") : tt("list.confirmDeleteTitle")}
        message={
          userToToggle?.active
            ? tt("list.confirmDeactivateMsg", { username: userToToggle?.username ?? "" })
            : tt("list.confirmDeleteMsg", { username: userToToggle?.username ?? "" })
        }
        confirmLabel={userToToggle?.active ? tt("list.confirmDeactivateBtn") : tt("list.confirmDeleteBtn")}
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />

      <ITConfirmDialog
        isOpen={!!userToForceDelete}
        onClose={() => setUserToForceDelete(null)}
        onConfirm={handleForceDelete}
        title={tt("list.forceDeleteTitle")}
        message={`${userToForceDelete?.username} tiene historial ligado (tickets, cartas, comentarios, movimientos, etc.) que normalmente bloquea el borrado. Como administrador puedes forzar su eliminación: los registros con autor obligatorio se reasignarán a tu usuario y el resto quedará sin autor. Esta acción no se puede deshacer.`}
        confirmLabel={tt("list.forceDeleteBtn")}
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />

      <ITConfirmDialog
        isOpen={!!userToReactivate}
        onClose={() => setUserToReactivate(null)}
        onConfirm={handleReactivate}
        title={tt("list.reactivateTitle")}
        message={tt("list.reactivateMsg", { username: userToReactivate?.username ?? "" })}
        confirmLabel={tt("list.reactivateBtn")}
        cancelLabel={tt("common:actions.cancel")}
        variant="success"
      />

      <ITDialog
        isOpen={!!userToPassword}
        onClose={() => setUserToPassword(null)}
        title={tt("list.passwordTitle", { username: userToPassword?.username ?? "" })}
      >
        <ITFlex direction="column" gap={3}>
          <ITInput
            name="newPassword"
            type="password"
            label="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Ingresa la nueva contraseña"
            autoFocus
          />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" onClick={() => setUserToPassword(null)}>
              {tt("common:actions.cancel")}
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              onClick={handleChangePassword}
              disabled={!newPassword.trim()}
            >
              <ITText className="font-bold text-[11px]">{tt("list.passwordBtn")}</ITText>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      {toast && (
        <ITToast
          message={toast.message}
          type={toast.type}
          position="bottom-center"
          duration={2500}
          onClose={() => setToast(null)}
        />
      )}
    </ITPage>
  );
}
