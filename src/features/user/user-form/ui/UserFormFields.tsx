import {
  ITFlex,
  ITGrid,
  ITInput,
  ITSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import {
  FaBuilding,
  FaIdCard,
  FaLock,
  FaShieldAlt,
  FaUserTag,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { Department } from "@entities/department";
import type { UserFormValues } from "../model/useUserForm";

interface Props {
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
}: Props) {
  const { t: tt } = useTranslation(["users", "common"]);
  const activeDepartments = departments.filter((d) => d.active);
  const fieldError = (key: string) => errors?.[key];
  const blob = (field: keyof UserFormValues) => () => onBlur?.(field);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
      <div className="space-y-6 min-w-0">
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            icon={<FaIdCard size={15} className="text-blue-600" />}
            iconBg="bg-blue-50"
            title={tt("form.sectionPersonal")}
            hint={tt("form.sectionPersonalHint")}
          />
          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={4}>
              <ITInput name="u_name" label={tt("form.name")} value={form.name} onChange={(e) => onFieldChange("name", e.target.value)} onBlur={blob("name")} required aria-invalid={!!fieldError("name")} />
              {fieldError("name") && (
                <span role="alert" className="text-red-500 text-xs mt-1 block">{fieldError("name")}</span>
              )}
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
              <ITInput name="u_num" label={tt("form.employeeNo")} value={form.numeroEmpleado} onChange={(e) => onFieldChange("numeroEmpleado", e.target.value)} onBlur={blob("numeroEmpleado")} aria-invalid={!!fieldError("numeroEmpleado")} />
              {fieldError("numeroEmpleado") && (
                <span role="alert" className="text-red-500 text-xs mt-1 block">{fieldError("numeroEmpleado")}</span>
              )}
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput name="u_email" type="email" label={tt("form.email")} value={form.email} onChange={(e) => onFieldChange("email", e.target.value)} onBlur={blob("email")} placeholder="usuario@empresa.com" aria-invalid={!!fieldError("email")} />
              {fieldError("email") && (
                <span role="alert" className="text-red-500 text-xs mt-1 block">{fieldError("email")}</span>
              )}
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput name="u_puesto" label={tt("form.position")} value={form.puesto} onChange={(e) => onFieldChange("puesto", e.target.value)} onBlur={blob("puesto")} aria-invalid={!!fieldError("puesto")} />
              {fieldError("puesto") && (
                <span role="alert" className="text-red-500 text-xs mt-1 block">{fieldError("puesto")}</span>
              )}
            </ITGrid>
          </ITGrid>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            icon={<FaShieldAlt size={15} className="text-violet-600" />}
            iconBg="bg-violet-50"
            title={tt("form.sectionAccess")}
            hint={tt("form.sectionAccessHint")}
          />
          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={4}>
              <ITInput name="u_username" label={tt("form.username")} value={form.username} onChange={(e) => onFieldChange("username", e.target.value)} onBlur={blob("username")} required aria-invalid={!!fieldError("username")} />
              {fieldError("username") && (
                <span role="alert" className="text-red-500 text-xs mt-1 block">{fieldError("username")}</span>
              )}
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITSelect name="u_role" label={tt("form.role")} options={roleOptions} value={form.role} onChange={(e) => onFieldChange("role", e.target.value as any)} required />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput name="u_password" type="password" label={`${tt("form.password")} ${!isEdit ? "*" : ""}`} value={form.password} onChange={(e) => onFieldChange("password", e.target.value)} onBlur={blob("password")} required={!isEdit} placeholder={isEdit ? tt("form.passwordPlaceholder") : ""} aria-invalid={!!fieldError("password")} />
              {fieldError("password") && (
                <span role="alert" className="text-red-500 text-xs mt-1 block">{fieldError("password")}</span>
              )}
            </ITGrid>
          </ITGrid>
        </section>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-5">
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            icon={<FaBuilding size={15} className="text-emerald-600" />}
            iconBg="bg-emerald-50"
            title={tt("form.sectionOrganization")}
            hint={tt("form.sectionOrganizationHint")}
          />
          <ITFlex direction="column" gap={4}>
            <ITSelect name="u_dept" label={tt("form.department")} options={activeDepartments.map((d) => ({ value: d.id, label: d.name }))} value={form.departmentId} onChange={(e) => onDepartmentChange(e.target.value)} />
            <ITSelect name="u_sub" label={tt("form.subarea")} options={(selectedDept?.subareas ?? []).map((s) => ({ value: s.id, label: s.name }))} value={form.subareaId} onChange={(e) => onFieldChange("subareaId", e.target.value)} />
          </ITFlex>
        </section>

        <section className="rounded-[24px] border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 p-6">
          <ITFlex align="center" gap={2}>
            <FaUserTag size={11} className="text-blue-700" />
            <ITText className="text-[10px] font-black uppercase tracking-widest text-blue-800">{tt("form.roleGuide")}</ITText>
            <ITText className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-black text-blue-700 ml-auto">{form.role}</ITText>
          </ITFlex>
          <ITText className="mt-3 text-[12px] font-black text-slate-700">{roleGuidance.title}</ITText>
          <ITText className="mt-1 text-[11px] leading-5 text-slate-600">{roleGuidance.summary}</ITText>
          <ul className="mt-3 space-y-2 text-[10px] font-bold text-slate-600">
            {roleGuidance.actions.map((action) => (
              <li key={action} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                {action}
              </li>
            ))}
          </ul>
          {isEdit && (
            <ITFlex align="center" gap={2} className="mt-4 border-t border-blue-100 pt-3">
              <FaLock size={9} className="text-slate-400" />
              <ITText className="text-[10px] text-slate-500">{tt("form.passwordEditHint")}</ITText>
            </ITFlex>
          )}
        </section>
      </aside>
    </div>
  );
}