import { useState } from "react";
import {
  FileTypeEnum,
  ITAlert,
  ITButton,
  ITDialog,
  ITDropfile,
  ITFlex,
  ITGrid,
  ITInput,
  ITSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import {
  FaBuilding,
  FaFileUpload,
  FaIdCard,
  FaLock,
  FaQuestion,
  FaShieldAlt,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { Department } from "@entities/department";
import { ROLE_LABELS } from "@entities/user";
import type { UserFormValues } from "../model/useUserForm";

interface Props {
  step: "personal" | "access" | "org" | "docs";
  isEdit: boolean;
  form: UserFormValues;
  errors?: Record<string, string>;
  onFieldChange: (field: keyof UserFormValues, value: string) => void;
  onBlur?: (field: keyof UserFormValues) => void;
  onDepartmentChange: (value: string) => void;
  departments: Department[];
  selectedDept: Department | undefined;
  roleGuidance: { title: string; summary: string; actions: string[] };
  roleOptions: Array<Record<string, string>>;
  // Documentación del alta
  requiredDocs?: Array<{ key: string; label: string; tipoId: string | null }>;
  docsFiles?: Record<string, File | null>;
  onPickDoc?: (key: string, file: File) => void;
  docsError?: string | null;
}

function SectionHeader({
  icon,
  iconBg,
  title,
  hint,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  hint: string;
}) {
  return (
    <ITFlex align="center" gap={3} className="mb-5">
      <ITFlex align="center" justify="center" className={`h-10 w-10 shrink-0 rounded-xl shadow-sm ${iconBg}`}>
        {icon}
      </ITFlex>
      <ITFlex direction="column" gap={0.25}>
        <ITText className="text-[12px] font-black uppercase tracking-widest text-slate-700">{title}</ITText>
        <ITText className="text-[10px] text-slate-400">{hint}</ITText>
      </ITFlex>
    </ITFlex>
  );
}

export default function UserFormFields({
  step,
  isEdit,
  form,
  errors,
  onFieldChange,
  onBlur,
  onDepartmentChange,
  departments,
  selectedDept,
  roleGuidance,
  roleOptions,
  requiredDocs,
  onPickDoc,
  docsError,
}: Props) {
  const { t: tt } = useTranslation(["users", "common"]);
  const activeDepartments = departments.filter((d) => d.active);
  const fieldError = (key: string) => errors?.[key];
  const blob = (field: keyof UserFormValues) => () => onBlur?.(field);
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      {step === "personal" && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            icon={<FaIdCard size={15} className="text-blue-600" />}
            iconBg="bg-blue-50"
            title={tt("form.sectionPersonal")}
            hint={tt("form.sectionPersonalHint")}
          />
          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={4}>
              <ITInput name="u_name" label={tt("form.name")} value={form.name} onChange={(e) => onFieldChange("name", e.target.value)} onBlur={blob("name")} required error={fieldError("name")} />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput name="u_second" label={tt("form.secondName")} value={form.segundoNombre} onChange={(e) => onFieldChange("segundoNombre", e.target.value)} />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput name="u_apa" label={tt("form.apellidoPaterno")} value={form.apellidoPaterno} onChange={(e) => onFieldChange("apellidoPaterno", e.target.value)} />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput name="u_ama" label={tt("form.apellidoMaterno")} value={form.apellidoMaterno} onChange={(e) => onFieldChange("apellidoMaterno", e.target.value)} />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput name="u_num" label={tt("form.employeeNo")} value={form.numeroEmpleado} onChange={(e) => onFieldChange("numeroEmpleado", e.target.value)} onBlur={blob("numeroEmpleado")} error={fieldError("numeroEmpleado")} />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput name="u_email" type="email" label={tt("form.email")} value={form.email} onChange={(e) => onFieldChange("email", e.target.value)} onBlur={blob("email")} placeholder="usuario@empresa.com" error={fieldError("email")} />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput name="u_puesto" label={tt("form.position")} value={form.puesto} onChange={(e) => onFieldChange("puesto", e.target.value)} onBlur={blob("puesto")} error={fieldError("puesto")} />
            </ITGrid>
          </ITGrid>
        </section>
      )}

      {step === "access" && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            icon={<FaShieldAlt size={15} className="text-violet-600" />}
            iconBg="bg-violet-50"
            title={tt("form.sectionAccess")}
            hint={tt("form.sectionAccessHint")}
          />
          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={4}>
              <ITInput name="u_username" label={tt("form.username")} value={form.username} onChange={(e) => onFieldChange("username", e.target.value)} onBlur={blob("username")} required error={fieldError("username")} />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITFlex align="end" gap={2}>
                <div className="flex-1">
                  <ITSelect name="u_role" label={tt("form.role")} options={roleOptions} value={form.role} onChange={(e) => onFieldChange("role", e.target.value as any)} required />
                </div>
                <ITButton variant="icon-only" size="sm" color="gray" onClick={() => setHelpOpen(true)} ariaLabel={tt("form.roleGuide")} title={tt("form.roleGuide")}>
                  <FaQuestion size={11} />
                </ITButton>
              </ITFlex>
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput name="u_password" type="password" label={`${tt("form.password")} ${!isEdit ? "*" : ""}`} value={form.password} onChange={(e) => onFieldChange("password", e.target.value)} onBlur={blob("password")} required={!isEdit} placeholder={isEdit ? tt("form.passwordPlaceholder") : ""} error={fieldError("password")} />
              {isEdit && (
                <ITFlex align="center" gap={2} className="mt-1">
                  <FaLock size={9} className="text-slate-400" />
                  <ITText className="text-[10px] text-slate-500">{tt("form.passwordEditHint")}</ITText>
                </ITFlex>
              )}
            </ITGrid>
          </ITGrid>
        </section>
      )}

      {step === "org" && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            icon={<FaBuilding size={15} className="text-emerald-600" />}
            iconBg="bg-emerald-50"
            title={tt("form.sectionOrganization")}
            hint={tt("form.sectionOrganizationHint")}
          />
          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={6}>
              <ITSelect name="u_dept" label={tt("form.department")} options={activeDepartments.map((d) => ({ value: d.id, label: d.name }))} value={form.departmentId} onChange={(e) => onDepartmentChange(e.target.value)} />
            </ITGrid>
            <ITGrid item xs={12} md={6}>
              <ITSelect name="u_sub" label={tt("form.subarea")} options={(selectedDept?.subareas ?? []).map((s) => ({ value: s.id, label: s.name }))} value={form.subareaId} onChange={(e) => onFieldChange("subareaId", e.target.value)} />
            </ITGrid>
          </ITGrid>
        </section>
      )}

      {step === "docs" && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            icon={<FaFileUpload size={15} className="text-amber-600" />}
            iconBg="bg-amber-50"
            title={tt("form.stepDocs")}
            hint={tt("form.docsHint")}
          />
          {docsError && (
            <ITFlex className="mb-3">
              <ITAlert variant="error" dismissible={false}>
                {docsError}
              </ITAlert>
            </ITFlex>
          )}
          <ITGrid container columns={12} spacing={4}>
            {(requiredDocs ?? []).map((doc) => (
              <ITGrid item xs={12} md={6} key={doc.key}>
                <ITFlex direction="column" gap={1}>
                  <ITText className="text-[11px] font-bold text-slate-600">{doc.label}</ITText>
                  <ITDropfile
                    onFileSelect={() => undefined}
                    onSubmit={(file) => onPickDoc?.(doc.key, file)}
                    acceptedFileTypes={[
                      FileTypeEnum.PNG,
                      FileTypeEnum.JPG,
                      FileTypeEnum.JPEG,
                      FileTypeEnum.PDF,
                    ]}
                    showStatusBadge
                  />
                </ITFlex>
              </ITGrid>
            ))}
          </ITGrid>
        </section>
      )}

      <ITDialog
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        title={tt("form.roleGuide")}
        useFormHeader
      >
        <div className="space-y-3 p-5">
          <ITFlex align="center" gap={2}>
            <ITText className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-black text-blue-700">{ROLE_LABELS[form.role]}</ITText>
          </ITFlex>
          <ITText className="text-[12px] font-black text-slate-700">{roleGuidance.title}</ITText>
          <ITText className="text-[11px] leading-5 text-slate-600">{roleGuidance.summary}</ITText>
          <ul className="space-y-2 text-[10px] font-bold text-slate-600">
            {roleGuidance.actions.map((action) => (
              <li key={action} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      </ITDialog>
    </>
  );
}

