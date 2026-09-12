import {
  ITAlert,
  ITButton,
  ITFlex,
  ITLoader,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaSave } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  UserFormFields,
  useUserForm,
} from "@features/user/user-form";

export default function UserFormPage() {
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["users", "common"]);

  const userForm = useUserForm();
  const { isEdit } = userForm;

  const handleSubmit = () => {
    userForm.handleSubmit().then((ok) => {
      if (ok) navigate("/usuarios");
    });
  };

  const title = isEdit ? tt("form.titleEdit") : tt("form.titleNew");
  const breadcrumb = isEdit ? tt("form.breadcrumbEdit") : tt("form.breadcrumbNew");

  if (userForm.loading) {
    return (
      <ITPage
        title={title}
        loading
        backAction={() => navigate(-1)}
        breadcrumbs={[
          { label: tt("list.breadcrumb"), onClick: () => navigate("/usuarios") },
          { label: breadcrumb },
        ]}
      >
        <ITFlex justify="center" align="center">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  const actions = (
    <ITFlex gap={2}>
      <ITButton variant="outlined" onClick={() => navigate("/usuarios")}>
        {tt("common:actions.cancel")}
      </ITButton>
      <ITButton
        variant="filled"
        color="primary"
        onClick={handleSubmit}
        disabled={userForm.saving || !userForm.canSubmit}
      >
        <ITFlex align="center" gap={1}>
          <FaSave size={12} />
          <ITText className="font-bold text-[11px]">
            {userForm.saving
              ? tt("form.saving")
              : isEdit
              ? tt("form.buttonEdit")
              : tt("form.buttonNew")}
          </ITText>
        </ITFlex>
      </ITButton>
    </ITFlex>
  );

  return (
    <ITPage
      title={title}
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: tt("list.breadcrumb"), onClick: () => navigate("/usuarios") },
        { label: breadcrumb },
      ]}
      actions={actions}
      maxWidth="7xl"
    >
      {userForm.error && (
        <ITAlert
          variant="error"
          dismissible
          onDismiss={() => userForm.setError(null)}
        >
          {userForm.error}
        </ITAlert>
      )}

      <UserFormFields
        isEdit={isEdit}
        form={userForm.form}
        onFieldChange={userForm.handleField}
        onDepartmentChange={userForm.handleDepartmentChange}
        departments={userForm.departments}
        selectedDept={userForm.selectedDept}
        roleGuidance={userForm.roleGuidance}
        roleOptions={userForm.ROLE_OPTIONS}
      />
    </ITPage>
  );
}