import { useState } from "react";
import {
  ITAlert,
  ITFlex,
  ITLoader,
  ITPage,
  ITStepper,
} from "@axzydev/axzy_ui_system";
import { FaBuilding, FaFileUpload, FaIdCard, FaShieldAlt, FaUserPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  UserFormFields,
  useUserForm,
} from "@features/user/user-form";

interface AppStep {
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

export default function UserFormPage() {
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["users", "common"]);
  const [step, setStep] = useState(0);

  const userForm = useUserForm();
  const { isEdit } = userForm;

  const handleFinish = () => {
    userForm.handleSubmit().then((ok) => {
      if (ok) {
        navigate("/usuarios");
      } else {
        const invalidStep = userForm.firstInvalidStep();
        if (invalidStep >= 0) setStep(invalidStep);
      }
    });
  };

  const title = isEdit ? tt("form.titleEdit") : tt("form.titleNew");
  const description = isEdit
    ? tt("form.descriptionEdit")
    : tt("form.descriptionNew");
  const breadcrumb = isEdit ? tt("form.breadcrumbEdit") : tt("form.breadcrumbNew");

  if (userForm.loading) {
    return (
      <ITPage
        title={title}
        description={description}
        loading
        backAction={() => navigate(-1)}
        icon={<FaUserPlus size={20} />}
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

  const fieldsProps = {
    isEdit,
    form: userForm.form,
    errors: userForm.errors,
    onFieldChange: userForm.handleField,
    onBlur: userForm.handleBlur,
    onDepartmentChange: userForm.handleDepartmentChange,
    departments: userForm.departments,
    selectedDept: userForm.selectedDept,
    roleGuidance: userForm.roleGuidance,
    roleOptions: userForm.ROLE_OPTIONS,
    requiredDocs: userForm.requiredDocs,
    docsFiles: userForm.docsFiles,
    onPickDoc: userForm.setDocFile,
    docsError: userForm.docsError,
  };

  const steps: AppStep[] = [
    {
      label: tt("form.sectionPersonal"),
      icon: <FaIdCard size={13} />,
      content: <UserFormFields step="personal" {...fieldsProps} />,
    },
    {
      label: tt("form.sectionAccess"),
      icon: <FaShieldAlt size={13} />,
      content: <UserFormFields step="access" {...fieldsProps} />,
    },
    {
      label: tt("form.sectionOrganization"),
      icon: <FaBuilding size={13} />,
      content: <UserFormFields step="org" {...fieldsProps} />,
    },
    ...(userForm.requiresDocs
      ? [
          {
            label: tt("form.stepDocs"),
            icon: <FaFileUpload size={13} />,
            content: <UserFormFields step="docs" {...fieldsProps} />,
          },
        ]
      : []),
  ];

  return (
    <ITPage
      title={title}
      description={description}
      backAction={() => navigate(-1)}
      icon={<FaUserPlus size={20} />}
      breadcrumbs={[
        { label: tt("list.breadcrumb"), onClick: () => navigate("/usuarios") },
        { label: breadcrumb },
      ]}
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

      <ITStepper
        steps={steps}
        currentStep={step}
        onStepChange={setStep}
        onFinish={handleFinish}
        allowClickToJump
        useIcons
        scrollableContent
        maxContentHeight="60vh"
        color="primary"
      />
    </ITPage>
  );
}