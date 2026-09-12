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
  FaUserPlus,
} from "react-icons/fa";
import type { Department } from "@entities/department";
import type { EmployeeFormValues } from "../model/useEmployeeForm";

interface Props {
  isEdit: boolean;
  form: EmployeeFormValues;
  onFieldChange: (field: keyof EmployeeFormValues, value: string) => void;
  onDepartmentChange: (value: string) => void;
  departments: Department[];
  selectedDept: Department | undefined;
}

export default function EmployeeFormFields({
  isEdit,
  form,
  onFieldChange,
  onDepartmentChange,
  departments,
  selectedDept,
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
              <ITText className="pt-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Ficha del empleado</ITText>
              <ITText className="text-2xl font-black tracking-tight text-slate-800">{isEdit ? "Actualiza los datos del empleado" : "Registra un nuevo empleado"}</ITText>
              <ITText className="pb-2 text-[11px] text-slate-500">Configura identidad y ubicación organizacional.</ITText>
            </ITFlex>
          </ITFlex>
        </section>

        <ITCard className="p-6 shadow-xl shadow-slate-200/35 border border-slate-100 rounded-[24px]">
          <ITFlex align="center" gap={3} className="mb-5">
            <ITFlex align="center" justify="center" className="h-9 w-9 rounded-xl bg-slate-100 text-slate-500"><FaIdCard size={14} /></ITFlex>
            <ITFlex direction="column" gap={0.25}><ITText className="text-[12px] font-black uppercase tracking-widest text-slate-700">Información personal</ITText><ITText className="text-[10px] text-slate-400">Datos visibles del empleado</ITText></ITFlex>
          </ITFlex>
          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={7}>
              <ITInput name="emp_name" label="Nombre" value={form.name} onChange={(e) => onFieldChange("name", e.target.value)} required />
            </ITGrid>
            <ITGrid item xs={12} md={5}>
              <ITInput name="emp_num" label="No. Empleado" value={form.numeroEmpleado} onChange={(e) => onFieldChange("numeroEmpleado", e.target.value)} />
            </ITGrid>
            <ITGrid item xs={12} md={7}>
              <ITInput name="emp_puesto" label="Puesto" value={form.puesto} onChange={(e) => onFieldChange("puesto", e.target.value)} />
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
            <ITSelect name="emp_dept" label="Departamento" options={activeDepartments.map((d) => ({ value: d.id, label: d.name }))} value={form.departmentId} onChange={(e) => onDepartmentChange(e.target.value)} />
            <ITSelect name="emp_sub" label="Subárea" options={(selectedDept?.subareas ?? []).map((s) => ({ value: s.id, label: s.name }))} value={form.subareaId} onChange={(e) => onFieldChange("subareaId", e.target.value)} />
          </ITFlex>
        </ITCard>
      </aside>
    </div>
  );
}