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
import { FaEdit, FaEye, FaKey, FaPlus, FaTrash, FaUndo, FaUserShield } from "react-icons/fa";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@core/store/store";
import { usersApi, type User } from "@core/api/auth.api";

export default function UsersListPage() {
  const navigate = useNavigate();
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
        message: res.soft ? "Usuario desactivado" : "Usuario eliminado definitivamente",
        type: "success",
      });
    } catch (e: any) {
      if (isAdmin && !target.active) {
        setUserToForceDelete(target);
      } else {
        setToast({ message: e.message || "Error al eliminar usuario", type: "error" });
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
      setToast({ message: "Usuario reactivado", type: "success" });
    } catch (e: any) {
      setToast({ message: e.message || "Error al reactivar usuario", type: "error" });
    }
  };

  const handleForceDelete = async () => {
    if (!userToForceDelete) return;
    setUserToForceDelete(null);
    try {
      await usersApi.delete(userToForceDelete.id, true);
      setReloadKey((k) => k + 1);
      setToast({ message: "Usuario eliminado definitivamente (forzado)", type: "success" });
    } catch (e: any) {
      setToast({ message: e.message || "Error al forzar eliminación", type: "error" });
    }
  };

  const handleChangePassword = async () => {
    if (!userToPassword || !newPassword.trim()) return;
    try {
      await usersApi.changePassword(userToPassword.id, newPassword);
      setUserToPassword(null);
      setNewPassword("");
      setToast({ message: "Contraseña actualizada", type: "success" });
    } catch (e: any) {
      setToast({ message: e.message || "Error al cambiar contraseña", type: "error" });
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
      title="Usuarios"
      description={`${total} usuario(s)`}
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: "Inicio", onClick: () => navigate("/") },
        { label: "Usuarios" },
      ]}
      actions={
        <ITButton
          variant="filled"
          color="primary"
          onClick={() => navigate("/usuarios/nuevo")}
        >
          <ITFlex align="center" gap={1}>
            <FaPlus size={12} />
            <ITText className="font-bold text-[11px]">Nuevo usuario</ITText>
          </ITFlex>
        </ITButton>
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
        title={userToToggle?.active ? "Desactivar usuario" : "Eliminar usuario"}
        message={
          userToToggle?.active
            ? `¿Desactivar a ${userToToggle?.username}? No podrá iniciar sesión.`
            : `¿Eliminar a ${userToToggle?.username}? Esta acción no se puede deshacer.`
        }
        confirmLabel={userToToggle?.active ? "Desactivar" : "Eliminar"}
        cancelLabel="Cancelar"
        variant="danger"
      />

      <ITConfirmDialog
        isOpen={!!userToForceDelete}
        onClose={() => setUserToForceDelete(null)}
        onConfirm={handleForceDelete}
        title="Forzar eliminación definitiva"
        message={`${userToForceDelete?.username} tiene historial ligado (tickets, cartas, comentarios, movimientos, etc.) que normalmente bloquea el borrado. Como administrador puedes forzar su eliminación: los registros con autor obligatorio se reasignarán a tu usuario y el resto quedará sin autor. Esta acción no se puede deshacer.`}
        confirmLabel="Forzar eliminación"
        cancelLabel="Cancelar"
        variant="danger"
      />

      <ITConfirmDialog
        isOpen={!!userToReactivate}
        onClose={() => setUserToReactivate(null)}
        onConfirm={handleReactivate}
        title="Reactivar usuario"
        message={`¿Reactivar a ${userToReactivate?.username}? Volverá a poder iniciar sesión.`}
        confirmLabel="Reactivar"
        cancelLabel="Cancelar"
        variant="success"
      />

      <ITDialog
        isOpen={!!userToPassword}
        onClose={() => setUserToPassword(null)}
        title={`Cambiar contraseña — ${userToPassword?.username}`}
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
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              onClick={handleChangePassword}
              disabled={!newPassword.trim()}
            >
              <ITText className="font-bold text-[11px]">Guardar</ITText>
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
