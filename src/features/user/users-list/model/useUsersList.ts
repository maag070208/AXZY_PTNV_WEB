import { useCallback, useState } from "react";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { usersApi, type User } from "@entities/user";

export const useUsersList = () => {
  const { t: tt } = useTranslation("users");
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [userToReactivate, setUserToReactivate] = useState<User | null>(null);
  const [userToForceDelete, setUserToForceDelete] = useState<User | null>(null);
  const [userToPassword, setUserToPassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  const fetchTableData = useCallback(async (params: ITDataTableFetchParams) => {
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
  }, []);

  /**
   * Confirmación de baja explícita: usa el endpoint /deactivate con motivo.
   * El diálogo de motivo se gestiona en la UI (DeactivateDialog). Esta función
   * solo dispara el request.
   */
  const handleDeactivate = async (reason: string) => {
    if (!userToToggle) return;
    const target = userToToggle;
    setUserToToggle(null);
    try {
      await usersApi.deactivate(target.id, { reason, notifyUser: true });
      setReloadKey((k) => k + 1);
      setToast({ message: tt("list.toastDeactivated"), type: "success" });
    } catch (e: any) {
      setToast({ message: e.message || tt("list.errorDeactivate"), type: "error" });
    }
  };

  /**
   * Toggle legacy: cuando se llamaba desde ITConfirmDialog sin motivo. Ya
   * reemplazado por handleDeactivate; se conserva solo para compatibilidad
   * con flujos donde se quiera desactivar directamente (no debería llamarse
   * desde la UI nueva).
   */
  const handleToggleActive = async (_isAdmin: boolean) => {
    if (!userToToggle) return;
    const target = userToToggle;
    setUserToToggle(null);
    try {
      await usersApi.deactivate(target.id, { reason: "Baja sin motivo especificado", notifyUser: true });
      setReloadKey((k) => k + 1);
      setToast({ message: tt("list.toastDeactivated"), type: "success" });
    } catch (e: any) {
      if (_isAdmin && !target.active) {
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
      await usersApi.reactivate(target.id);
      setReloadKey((k) => k + 1);
      setToast({ message: tt("list.toastReactivated"), type: "success" });
    } catch (e: any) {
      setToast({ message: e.message || tt("list.errorReactivate"), type: "error" });
    }
  };

  const handleForceDelete = async () => {
    if (!userToForceDelete) return;
    const target = userToForceDelete;
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

  return {
    total,
    reloadKey,
    userToToggle,
    setUserToToggle,
    userToReactivate,
    setUserToReactivate,
    userToForceDelete,
    setUserToForceDelete,
    userToPassword,
    setUserToPassword,
    newPassword,
    setNewPassword,
    toast,
    setToast,
    fetchTableData,
    handleToggleActive,
    handleDeactivate,
    handleReactivate,
    handleForceDelete,
    handleChangePassword,
    reload: () => setReloadKey((k) => k + 1),
  };
};

export type UseUsersList = ReturnType<typeof useUsersList>;