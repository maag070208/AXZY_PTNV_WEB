import { LottieLoader } from "@shared/ui/lottie-loader";
import Langostin from "@shared/ui/langostin/Langostin";
import { dyn } from "@shared/i18n";
import { Fragment, useState, type FocusEvent, type KeyboardEvent } from "react";
import { ITAlert, ITButton, ITFlex, ITPage } from "@axzydev/axzy_ui_system";
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

/** Clave de la guía de Langostin para cada campo (por el `name` del input). */
const HINT_KEYS: Record<string, string> = {
  u_name: "name",
  u_second: "secondName",
  u_apa: "paternalSurname",
  u_ama: "maternalSurname",
  u_email: "email",
  u_num: "employeeNumber",
  u_jobTitle: "jobTitle",
  u_username: "username",
  u_role: "role",
  u_password: "password",
};

export default function UserFormPage() {
  const navigate = useNavigate();
  // Langostin sigue el campo donde está el cursor: cada input tiene su propia guía.
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { t: tt } = useTranslation(["users", "common"]);

  const userForm = useUserForm();
  const { isEdit } = userForm;

  // Campo del formulario (`name` del input) para cada dato con error.
  const INPUT_NAME: Partial<Record<keyof typeof userForm.form, string>> = {
    name: "u_name",
    username: "u_username",
    password: "u_password",
    email: "u_email",
    employeeNumber: "u_num",
    jobTitle: "u_jobTitle",
  };

  const handleFinish = () => {
    userForm.handleSubmit().then((result) => {
      if (result.ok) {
        navigate("/users");
        return;
      }
      const input = result.field ? INPUT_NAME[result.field] : undefined;
      if (input) document.querySelector<HTMLInputElement>(`[name="${input}"]`)?.focus();
    });
  };

  const title = isEdit ? tt("form.titleEdit") : tt("form.titleNew");
  const description = isEdit
    ? tt("form.descriptionEdit")
    : tt("form.descriptionNew");
  const breadcrumb = isEdit ? tt("form.breadcrumbEdit") : tt("form.breadcrumbNew");

  if (userForm.loading) {
    return (
      <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
        noPadding
        title={title}
        description={description}
        loading
        backAction={() => navigate(-1)}
        icon={<FaUserPlus size={20} />}
        breadcrumbs={[
          { label: tt("list.breadcrumb"), onClick: () => navigate("/users") },
          { label: breadcrumb },
        ]}
      >
        <ITFlex justify="center" align="center">
          <LottieLoader size="lg" />
        </ITFlex>
      </ITPage>
    );
  }

  const fieldsProps = {
    isEdit,
    personFields: true,
    form: userForm.form,
    errors: userForm.errors,
    onFieldChange: userForm.handleField,
    onBlur: userForm.handleBlur,
    onDepartmentChange: userForm.handleDepartmentChange,
    departments: userForm.departments,
    selectedDept: userForm.selectedDept,
    roleGuidance: userForm.roleGuidance,
    roleOptions: userForm.ROLE_OPTIONS,
    extraRoleOptions: userForm.EXTRA_ROLE_OPTIONS,
    onToggleExtraRole: userForm.toggleExtraRole,
    requiredDocs: userForm.requiredDocs,
    docsFiles: userForm.docsFiles,
    onPickDoc: userForm.setDocFile,
    docsError: userForm.docsError,
    uniqueness: userForm.uniqueness,
  };

  // Lo que Langostin le dice al usuario según el estado del formulario.
  const hasErrors = Object.keys(userForm.errors).length > 0 || Boolean(userForm.docsError);
  const focusedHint = focusedInput && HINT_KEYS[focusedInput] ? dyn(tt)(`form.hints.${HINT_KEYS[focusedInput]}`) : null;
  const checking = Object.values(userForm.uniqueness).includes("checking");
  const guide = userForm.saving
    ? tt("form.saving")
    : checking
      ? tt("form.checking")
      : hasErrors
        ? tt("form.guideFix")
        : (focusedHint ?? tt("form.guideStart"));
  const langostinAnim = userForm.saving || checking ? "work" : "wave";
  const complete =
    !!userForm.form.name.trim() &&
    !!userForm.form.paternalSurname.trim() &&
    !!userForm.form.username.trim() &&
    !!userForm.form.password &&
    !!userForm.form.employeeNumber.trim() &&
    !!userForm.form.email.trim() &&
    !hasErrors &&
    !checking &&
    (!userForm.requiresDocs || userForm.requiredDocs.every((d) => userForm.docsFiles[d.key]));

  // Enter pasa al siguiente campo del formulario, como en un formulario normal.
  const handleEnter = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (event.key !== "Enter" || target.tagName !== "INPUT" || target.getAttribute("role") === "combobox") return;
    const fields = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("input, select, textarea")).filter(
      (el) => !(el as HTMLInputElement).disabled && (el as HTMLInputElement).type !== "hidden" && el.tabIndex !== -1
    );
    const next = fields[fields.indexOf(target) + 1];
    if (!next) return;
    event.preventDefault();
    next.focus();
  };

  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    const name = (event.target as HTMLInputElement).name;
    if (name) setFocusedInput(name);
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
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={title}
      description={description}
      backAction={() => navigate(-1)}
      icon={<FaUserPlus size={20} />}
      breadcrumbs={[
        { label: tt("list.breadcrumb"), onClick: () => navigate("/users") },
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


      <ITFlex justify="end" align="center" gap={3} className="mb-6">
        <ITButton variant="outlined" color="secondary" onClick={() => navigate(-1)} disabled={userForm.saving}>
          {tt("form.cancel")}
        </ITButton>
        <ITButton variant="raised-text" color="primary" onClick={handleFinish} disabled={userForm.saving}>
          {isEdit ? tt("form.save") : tt("form.create")}
        </ITButton>
      </ITFlex>

      <div onKeyDown={handleEnter} onFocus={handleFocus}>
        <ITFlex direction="column" gap={6}>
          {steps.map((section) => (
            <Fragment key={section.label}>{section.content}</Fragment>
          ))}
        </ITFlex>
      </div>

      {/* Langostin flota abajo a la derecha: guía, avisa mientras verifica y anima mientras guarda. */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex items-end gap-3">
        <div className="pointer-events-auto max-w-xs rounded-2xl rounded-br-sm border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-lg">
          <p>{!userForm.saving && !isEdit && complete ? tt("form.ready") : guide}</p>
          {!userForm.saving && !isEdit && complete && (
            <ITButton variant="raised-text" color="primary" className="mt-3 w-full" onClick={handleFinish}>
              {tt("form.create")}
            </ITButton>
          )}
        </div>
        <div className="pointer-events-auto drop-shadow-lg">
          <Langostin anim={langostinAnim} size={72} label={tt("form.guideLabel")} />
        </div>
      </div>
    </ITPage>
  );
}