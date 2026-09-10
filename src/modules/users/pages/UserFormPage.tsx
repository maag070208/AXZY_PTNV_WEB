import {
  ITAlert,
  ITButton,
  ITCard,
  ITFlex,
  ITGrid,
  ITInput,
  ITLoader,
  ITPage,
  ITSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaBuilding, FaIdCard, FaSave, FaShieldAlt, FaUserPlus } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usersApi, type User } from "@core/api/auth.api";
import {
  departmentsApi,
  type Department,
} from "@core/api/departments.api";

export default function UserFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    name: "",
    role: "EMPLEADO" as "ADMIN" | "GERENTE" | "JEFE_DE_AREA" | "EMPLEADO",
    numeroEmpleado: "",
    puesto: "",
    departmentId: "",
    subareaId: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    departmentsApi
      .list(true)
      .then(setDepartments)
      .catch(() => setDepartments([]))
      .finally(() => setLoading(false));

    if (id) {
      usersApi.get(id).then((u: User) => {
        setForm({
          username: u.username,
          email: u.email ?? "",
          password: "",
          name: u.name,
          role: u.role,
          numeroEmpleado: u.numeroEmpleado ?? "",
          puesto: u.puesto ?? "",
          departmentId: u.departmentId ?? "",
          subareaId: u.subareaId ?? "",
        });
      }).catch(() => {
        setError("No se pudo cargar el usuario");
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const selectedDept = departments.find((d) => d.id === form.departmentId);

  const handleSubmit = async () => {
    if (!form.username || !form.name) return;
    if (!isEdit && !form.password) return;
    setSaving(true);
    try {
      if (isEdit) {
        await usersApi.update(id!, {
          username: form.username,
          email: form.email || null,
          name: form.name,
          role: form.role,
          numeroEmpleado: form.numeroEmpleado || undefined,
          puesto: form.puesto || undefined,
          departmentId: form.departmentId || undefined,
          subareaId: form.subareaId || undefined,
        });
      } else {
        await usersApi.create({
          username: form.username,
          email: form.email || undefined,
          password: form.password,
          name: form.name,
          role: form.role,
          numeroEmpleado: form.numeroEmpleado || undefined,
          puesto: form.puesto || undefined,
          departmentId: form.departmentId || undefined,
          subareaId: form.subareaId || undefined,
        });
      }
      navigate("/usuarios");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ITPage
        title={isEdit ? "Editar usuario" : "Nuevo usuario"}
        loading
        backAction={() => navigate(-1)}
        breadcrumbs={[
          { label: "Usuarios", onClick: () => navigate("/usuarios") },
          { label: isEdit ? "Editar" : "Nuevo" },
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
        Cancelar
      </ITButton>
      <ITButton
        variant="filled"
        color="primary"
        onClick={handleSubmit}
        disabled={saving || !form.username || (!isEdit && !form.password) || !form.name}
      >
        <ITFlex align="center" gap={1}>
          <FaSave size={12} />
          <ITText className="font-bold text-[11px]">
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear usuario"}
          </ITText>
        </ITFlex>
      </ITButton>
    </ITFlex>
  );

  return (
    <ITPage
      title={isEdit ? "Editar usuario" : "Nuevo usuario"}
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: "Usuarios", onClick: () => navigate("/usuarios") },
        { label: isEdit ? "Editar" : "Nuevo" },
      ]}
      actions={actions}
      maxWidth="7xl"
    >
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
        <div className="space-y-6 min-w-0">
          <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white px-6 py-7 sm:px-8 shadow-xl shadow-slate-200/40">
            <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-blue-50" />
            <ITFlex align="center" gap={3} className="relative">
              <ITFlex align="center" justify="center" className="h-11 w-11 shrink-0 rounded-2xl bg-blue-50 text-blue-600">
                <FaUserPlus size={17} />
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
                <ITInput
                  name="u_name"
                  label="Nombre"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </ITGrid>
              <ITGrid item xs={12} md={5}>
                <ITInput
                  name="u_num"
                  label="No. Empleado"
                  value={form.numeroEmpleado}
                  onChange={(e) => setForm((f) => ({ ...f, numeroEmpleado: e.target.value }))}
                />
              </ITGrid>
              <ITGrid item xs={12} md={7}>
                <ITInput
                  name="u_email"
                  type="email"
                  label="Correo"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="usuario@empresa.com"
                />
              </ITGrid>
              <ITGrid item xs={12} md={5}>
                <ITInput
                  name="u_puesto"
                  label="Puesto"
                  value={form.puesto}
                  onChange={(e) => setForm((f) => ({ ...f, puesto: e.target.value }))}
                />
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
                <ITInput name="u_username" label="Username" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} required />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITSelect name="u_role" label="Rol" options={[{ value: "ADMIN", label: "ADMIN" }, { value: "GERENTE", label: "GERENTE" }, { value: "JEFE_DE_AREA", label: "JEFE DE AREA" }, { value: "EMPLEADO", label: "EMPLEADO" }]} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as any }))} required />
              </ITGrid>
              <ITGrid item xs={12}>
                <ITInput name="u_password" type="password" label={`Contraseña ${isEdit ? "" : "*"}`} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required={!isEdit} placeholder={isEdit ? "Dejar en blanco para no cambiar" : ""} />
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
              <ITSelect name="u_dept" label="Departamento" options={departments.filter((d) => d.active).map((d) => ({ value: d.id, label: d.name }))} value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value, subareaId: "" }))} />
              <ITSelect name="u_sub" label="Subárea" options={(selectedDept?.subareas ?? []).map((s) => ({ value: s.id, label: s.name }))} value={form.subareaId} onChange={(e) => setForm((f) => ({ ...f, subareaId: e.target.value }))} />
            </ITFlex>
          </ITCard>
          <ITCard className="border border-blue-100 bg-blue-50/50 p-5 rounded-[24px]">
            <ITText className="text-[10px] font-black uppercase tracking-widest text-blue-800">Nota</ITText>
            <ITText className="mt-2 text-[11px] leading-5 text-slate-600">El rol define las acciones disponibles dentro del sistema. En edición, deja la contraseña vacía para conservarla.</ITText>
          </ITCard>
        </aside>
      </div>
    </ITPage>
  );
}
