import {
  ITCard,
  ITFlex,
  ITGrid,
  ITInput,
  ITSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import {
  FaBuilding,
  FaIdCard,
  FaPencilAlt,
  FaShieldAlt,
  FaUserPlus,
} from "react-icons/fa";
import type { Department } from "@entities/department";
import type { UserFormValues } from "../model/useUserForm";

interface Props {
  isEdit: boolean;
  form: UserFormValues;
  onFieldChange: (field: keyof UserFormValues, value: string) => void;
  onDepartmentChange: (value: string) => void;
  departments: Department[];
  selectedDept: Department | undefined;
  roleGuidance: { title: string; summary: string; actions: string[] };
  roleOptions: Array<Record<string, string>>;
}

export default function UserFormFields({
  isEdit,
  form,
  onFieldChange,
  onDepartmentChange,
  departments,
  selectedDept,
  roleGuidance,
  roleOptions,
}: Props) {
  const activeDepartments = departments.filter((d) => d.active);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
      <div className="space-y-6 min-w-0">
        <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white px-6 py-7 sm:px-8 shadow-xl shadow-slate-200/40">
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-blue-50" />
          <ITFlex align="center" gap={3} className="relative">
            <ITFlex align="center" justify="center" className="h-11 w-11 shrink-0 rounded-2xl bg-blue-50 text-blue-600">
              {isEdit ? <FaPencilAlt size={16} /> : <FaUserPlus size={17} />}
            </ITFlex>
            <ITFlex direction="column" gap={0.5}>
              <ITText className="pt-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Cuenta del sistema</ITText>
              <ITText className="text-2xl font-black tracking-tight text-slate-800">{isEdit ? "Actualiza el perfil" : "Crea un nuevo usuario"}</ITText>
              <ITText className="pb-2 text-[11px] text-slate-500">Configura identidad, acceso y ubicación organizacional.</ITText>
            </ITFlex>
          </ITFlex>
        </section>

        <ITCard className="p-6 shadow-xl shadow-slate-200/35 border border-slate-100 rounded-[24px]">
          <ITFlex align="center" gap={3} className="mb-5">
            <ITFlex align="center" justify="center" className="h-9 w-9 rounded-xl bg-slate-100 text-slate-500"><FaIdCard size={14} /></ITFlex>
            <ITFlex direction="column" gap={0.25}><ITText className="text-[12px] font-black uppercase tracking-widest text-slate-700">Información personal</ITText><ITText className="text-[10px] text-slate-400">Datos visibles del usuario</ITText></ITFlex>
          </ITFlex>
          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={7}>
              <ITInput name="u_name" label="Nombre" value={form.name} onChange={(e) => onFieldChange("name", e.target.value)} required />
            </ITGrid>
            <ITGrid item xs={12} md={5}>
              <ITInput name="u_num" label="No. Empleado" value={form.numeroEmpleado} onChange={(e) => onFieldChange("numeroEmpleado", e.target.value)} />
            </ITGrid>
            <ITGrid item xs={12} md={7}>
              <ITInput name="u_email" type="email" label="Correo" value={form.email} onChange={(e) => onFieldChange("email", e.target.value)} placeholder="usuario@empresa.com" />
            </ITGrid>
            <ITGrid item xs={12} md={5}>
              <ITInput name="u_puesto" label="Puesto" value={form.puesto} onChange={(e) => onFieldChange("puesto", e.target.value)} />
            </ITGrid>
          </ITGrid>
        </ITCard>

        <ITCard className="p-6 shadow-xl shadow-slate-200/35 border border-slate-100 rounded-[24px]">
          <ITFlex align="center" gap={3} className="mb-5">
            <ITFlex align="center" justify="center" className="h-9 w-9 rounded-xl bg-violet-50 text-violet-600"><FaShieldAlt size={14} /></ITFlex>
            <ITFlex direction="column" gap={0.25}><ITText className="text-[12px] font-black uppercase tracking-widest text-slate-700">Acceso y permisos</ITText><ITText className="text-[10px] text-slate-400">Credenciales y nivel de acceso</ITText></ITFlex>
          </ITFlex>
          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={6}>
              <ITInput name="u_username" label="Username" value={form.username} onChange={(e) => onFieldChange("username", e.target.value)} required />
            </ITGrid>
            <ITGrid item xs={12} md={6}>
              <ITSelect name="u_role" label="Rol" options={roleOptions} value={form.role} onChange={(e) => onFieldChange("role", e.target.value as any)} required />
            </ITGrid>
            <ITGrid item xs={12}>
              <ITInput name="u_password" type="password" label={`Contraseña ${isEdit ? "" : "*"}`} value={form.password} onChange={(e) => onFieldChange("password", e.target.value)} required={!isEdit} placeholder={isEdit ? "Dejar en blanco para no cambiar" : ""} />
            </ITGrid>
          </ITGrid>
        </ITCard>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-5">
        <ITCard className="p-6 shadow-xl shadow-slate-200/35 border border-slate-100 rounded-[24px]">
          <ITFlex align="center" gap={3} className="mb-5">
            <ITFlex align="center" justify="center" className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600"><FaBuilding size={14} /></ITFlex>
            <ITFlex direction="column" gap={0.25}><ITText className="text-[12px] font-black uppercase tracking-widest text-slate-700">Organización</ITText><ITText className="text-[10px] text-slate-400">Área donde trabaja</ITText></ITFlex>
          </ITFlex>
          <ITFlex direction="column" gap={4}>
            <ITSelect name="u_dept" label="Departamento" options={activeDepartments.map((d) => ({ value: d.id, label: d.name }))} value={form.departmentId} onChange={(e) => onDepartmentChange(e.target.value)} />
            <ITSelect name="u_sub" label="Subárea" options={(selectedDept?.subareas ?? []).map((s) => ({ value: s.id, label: s.name }))} value={form.subareaId} onChange={(e) => onFieldChange("subareaId", e.target.value)} />
          </ITFlex>
        </ITCard>
        <ITCard className="border border-blue-100 bg-blue-50/50 p-5 rounded-[24px]">
          <ITFlex align="center" gap={2}>
            <ITText className="text-[10px] font-black uppercase tracking-widest text-blue-800">Guía del rol</ITText>
            <ITText className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-black text-blue-700">{form.role}</ITText>
          </ITFlex>
          <ITText className="mt-2 text-[12px] font-black text-slate-700">{roleGuidance.title}</ITText>
          <ITText className="mt-1 text-[11px] leading-5 text-slate-600">{roleGuidance.summary}</ITText>
          <ul className="mt-3 space-y-2 text-[10px] font-bold text-slate-600">
            {roleGuidance.actions.map((action) => (
              <li key={action} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                {action}
              </li>
            ))}
          </ul>
          <ITText className="mt-4 border-t border-blue-100 pt-3 text-[10px] text-slate-500">En edición, deja la contraseña vacía para conservarla.</ITText>
        </ITCard>
      </aside>
    </div>
  );
}