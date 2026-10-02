import { useEffect, useState } from "react";
import { ITAlert, ITButton, ITDialog, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaSave, FaUserCog } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import { useUserForm, UserFormFields } from "..";

interface Props {
  /** Usuario a editar; `null` cierra el diálogo. */
  userId: string | null;
  onClose: () => void;
  /** Se llama tras guardar (la lista refresca). */
  onSaved?: () => void;
}

/**
 * Edición de una cuenta en un diálogo, sobre la lista de Usuarios.
 *
 * Edita lo que es de la CUENTA: acceso (usuario, contraseña, roles) y
 * organización (departamento y subárea). Los datos de la persona y los
 * laborales (nombre, correo, nº de empleado, puesto) viven en su expediente
 * (`/employees/:id/edit`) y aquí solo se capturan si la cuenta no tiene
 * expediente, que es su único lugar.
 */
export default function UserEditDialog({ userId, onClose, onSaved }: Props) {
  const { t: tt } = useTranslation(["users", "common"]);
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const canSeeRecords = useCan("hr.records");
  const userForm = useUserForm(userId ?? undefined);
  const { editsPerson, hasRecord, loading } = userForm;

  // Al cambiar de usuario se limpia el estado de la corrida anterior.
  useEffect(() => {
    setSaved(false);
    userForm.setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSave = async () => {
    const ok = await userForm.handleSubmit();
    if (!ok) return;
    setSaved(true);
    onSaved?.();
  };

  return (
    <ITDialog
      isOpen={!!userId}
      onClose={onClose}
      title={tt("form.titleEdit")}
      className="max-w-3xl"
    >
      <ITFlex direction="column" gap={4}>
        {userForm.error && (
          <ITAlert variant="error" dismissible onDismiss={() => userForm.setError(null)}>
            {userForm.error}
          </ITAlert>
        )}
        {saved && <ITAlert variant="success">{tt("form.saved")}</ITAlert>}

        {/* Con expediente, los datos de la persona se editan en Personal. */}
        {hasRecord && (
          <ITFlex align="center" justify="between" wrap="wrap" gap={2} className="rounded-xl bg-[#fff7ed] px-3 py-2">
            <ITFlex align="center" gap={2}>
              <FaUserCog size={12} className="text-[#ea580c]" />
              <ITText className="!text-[11px] text-slate-600">{tt("form.personElsewhere")}</ITText>
            </ITFlex>
            {canSeeRecords && userId && (
              <ITButton
                variant="outlined"
                color="primary"
                size="sm"
                onClick={() => navigate(`/employees/${userId}/edit`)}
              >
                <ITText className="!text-[11px] font-bold">{tt("form.openRecord")}</ITText>
              </ITButton>
            )}
          </ITFlex>
        )}

        {editsPerson && (
          <UserFormFields
            step="personal"
            isEdit
            personFields
            form={userForm.form}
            errors={userForm.errors}
            onFieldChange={userForm.handleField}
            onBlur={userForm.handleBlur}
            onDepartmentChange={userForm.handleDepartmentChange}
            departments={userForm.departments}
            selectedDept={userForm.selectedDept}
            roleGuidance={userForm.roleGuidance}
            roleOptions={userForm.ROLE_OPTIONS}
          />
        )}
        <UserFormFields
          step="access"
          isEdit
          form={userForm.form}
          errors={userForm.errors}
          onFieldChange={userForm.handleField}
          onBlur={userForm.handleBlur}
          onDepartmentChange={userForm.handleDepartmentChange}
          departments={userForm.departments}
          selectedDept={userForm.selectedDept}
          roleGuidance={userForm.roleGuidance}
          roleOptions={userForm.ROLE_OPTIONS}
          extraRoleOptions={userForm.EXTRA_ROLE_OPTIONS}
          onToggleExtraRole={userForm.toggleExtraRole}
        />
        <UserFormFields
          step="org"
          isEdit
          form={userForm.form}
          errors={userForm.errors}
          onFieldChange={userForm.handleField}
          onBlur={userForm.handleBlur}
          onDepartmentChange={userForm.handleDepartmentChange}
          departments={userForm.departments}
          selectedDept={userForm.selectedDept}
          roleGuidance={userForm.roleGuidance}
          roleOptions={userForm.ROLE_OPTIONS}
        />

        <ITFlex justify="end" gap={2} className="pt-1">
          <ITButton variant="outlined" color="secondary" onClick={onClose}>
            <ITText className="!text-[11px] font-bold">{tt("common:actions.cancel")}</ITText>
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            onClick={() => void handleSave()}
            disabled={userForm.saving || loading}
          >
            <ITFlex align="center" gap={1}>
              <FaSave size={11} />
              <ITText className="!text-[11px] font-bold">
                {userForm.saving ? tt("form.saving") : tt("form.save")}
              </ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
