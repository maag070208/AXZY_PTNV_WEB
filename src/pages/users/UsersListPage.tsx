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
import { useCan } from "@entities/user";
import {
  useUsersList,
  UsersTable,
} from "@features/user/users-list";
import { DeactivateDialog } from "@features/hr/employee-detail";

export default function UsersListPage() {
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["users", "common"]);
  const canManageUsers = useCan("users.view");

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
            onClick={() => navigate("/users/import")}
          >
            <ITFlex align="center" gap={1}>
              <FaFileExcel size={12} />
              <ITText className="font-bold text-[11px]">{tt("list.importExcel")}</ITText>
            </ITFlex>
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            onClick={() => navigate("/users/new")}
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
        onView={(u) => navigate(`/employees/${u.id}`)}
        onEdit={(u) => navigate(`/users/${u.id}/edit`)}
      />

      {/* Para usuarios activos, baja con captura de motivo */}
      <DeactivateDialog
        isOpen={!!fx.userToToggle && fx.userToToggle.active}
        onClose={() => fx.setUserToToggle(null)}
        onConfirm={(reason) => fx.handleDeactivate(reason)}
        userName={fx.userToToggle?.active ? fx.userToToggle.name : undefined}
      />

      {/* Para usuarios ya inactivos, confirmación de borrado físico */}
      <ITConfirmDialog
        isOpen={!!fx.userToToggle && !fx.userToToggle.active}
        onClose={() => fx.setUserToToggle(null)}
        onConfirm={() => fx.handleToggleActive(canManageUsers)}
        title={tt("list.confirmDeleteTitle")}
        message={tt("list.confirmDeleteMsg", {
          username: fx.userToToggle?.username ?? "",
        })}
        confirmLabel={tt("list.confirmDeleteBtn")}
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />

      <ITConfirmDialog
        isOpen={!!fx.userToForceDelete}
        onClose={() => fx.setUserToForceDelete(null)}
        onConfirm={fx.handleForceDelete}
        title={tt("list.forceDeleteTitle")}
        message={tt("list.forceDeleteMessage", { username: fx.userToForceDelete?.username ?? "" })}
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