import {
  ITButton,
  ITConfirmDialog,
  ITDialog,
  ITFlex,
  ITInput,
  ITPage,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaFileExcel, FaPlus, FaUserShield } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { RootState } from "@app/store";
import {
  useUsersList,
  UsersTable,
} from "@features/user/users-list";

export default function UsersListPage() {
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["users", "common"]);
  const authUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = authUser?.role === "ADMIN";

  const fx = useUsersList();

  return (
    <ITPage
      title={tt("list.title")}
      description={tt("list.description", { count: fx.total })}
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
      <UsersTable
        fx={fx}
        onView={(u) => navigate(`/usuarios/${u.id}`)}
        onEdit={(u) => navigate(`/usuarios/${u.id}/editar`)}
      />

      <ITConfirmDialog
        isOpen={!!fx.userToToggle}
        onClose={() => fx.setUserToToggle(null)}
        onConfirm={() => fx.handleToggleActive(isAdmin)}
        title={
          fx.userToToggle?.active
            ? tt("list.confirmDeactivateTitle")
            : tt("list.confirmDeleteTitle")
        }
        message={
          fx.userToToggle?.active
            ? tt("list.confirmDeactivateMsg", {
                username: fx.userToToggle?.username ?? "",
              })
            : tt("list.confirmDeleteMsg", {
                username: fx.userToToggle?.username ?? "",
              })
        }
        confirmLabel={
          fx.userToToggle?.active
            ? tt("list.confirmDeactivateBtn")
            : tt("list.confirmDeleteBtn")
        }
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />

      <ITConfirmDialog
        isOpen={!!fx.userToForceDelete}
        onClose={() => fx.setUserToForceDelete(null)}
        onConfirm={fx.handleForceDelete}
        title={tt("list.forceDeleteTitle")}
        message={`${fx.userToForceDelete?.username} tiene historial ligado (tickets, cartas, comentarios, movimientos, etc.) que normalmente bloquea el borrado. Como administrador puedes forzar su eliminación: los registros con autor obligatorio se reasignarán a tu usuario y el resto quedará sin autor. Esta acción no se puede deshacer.`}
        confirmLabel={tt("list.forceDeleteBtn")}
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />

      <ITConfirmDialog
        isOpen={!!fx.userToReactivate}
        onClose={() => fx.setUserToReactivate(null)}
        onConfirm={fx.handleReactivate}
        title={tt("list.reactivateTitle")}
        message={tt("list.reactivateMsg", {
          username: fx.userToReactivate?.username ?? "",
        })}
        confirmLabel={tt("list.reactivateBtn")}
        cancelLabel={tt("common:actions.cancel")}
        variant="success"
      />

      <ITDialog
        isOpen={!!fx.userToPassword}
        onClose={() => fx.setUserToPassword(null)}
        className="it-dialog-panel"
        title={tt("list.passwordTitle", {
          username: fx.userToPassword?.username ?? "",
        })}
      >
        <ITFlex direction="column" gap={3}>
          <ITInput
            name="newPassword"
            type="password"
            label={tt("list.passwordLabel")}
            value={fx.newPassword}
            onChange={(e) => fx.setNewPassword(e.target.value)}
            placeholder={tt("list.passwordPlaceholder")}
            autoFocus
          />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" onClick={() => fx.setUserToPassword(null)}>
              {tt("common:actions.cancel")}
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              onClick={fx.handleChangePassword}
              disabled={!fx.newPassword.trim()}
            >
              <ITText className="font-bold text-[11px]">{tt("list.passwordBtn")}</ITText>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      {fx.toast && (
        <ITToast
          message={fx.toast.message}
          type={fx.toast.type}
          position="bottom-center"
          duration={2500}
          onClose={() => fx.setToast(null)}
        />
      )}
    </ITPage>
  );
}