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
import { FaSave } from "react-icons/fa";
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
    >
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} md={4}>
            <ITInput
              name="u_username"
              label="Username *"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITInput
              name="u_password"
              type="password"
              label={`Contraseña ${isEdit ? "" : "*"}`}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required={!isEdit}
              placeholder={isEdit ? "Dejar en blanco para no cambiar" : ""}
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITInput
              name="u_name"
              label="Nombre *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITSelect
              name="u_role"
              label="Rol *"
              options={[
                { value: "ADMIN", label: "ADMIN" },
                { value: "GERENTE", label: "GERENTE" },
                { value: "JEFE_DE_AREA", label: "JEFE DE AREA" },
                { value: "EMPLEADO", label: "EMPLEADO" },
              ]}
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as any }))}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITInput
              name="u_num"
              label="No. Empleado"
              value={form.numeroEmpleado}
              onChange={(e) => setForm((f) => ({ ...f, numeroEmpleado: e.target.value }))}
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITInput
              name="u_puesto"
              label="Puesto"
              value={form.puesto}
              onChange={(e) => setForm((f) => ({ ...f, puesto: e.target.value }))}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITSelect
              name="u_dept"
              label="Departamento"
              options={departments
                .filter((d) => d.active)
                .map((d) => ({ value: d.id, label: d.name }))}
              value={form.departmentId}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  departmentId: e.target.value,
                  subareaId: "",
                }))
              }
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITSelect
              name="u_sub"
              label="Subárea"
              options={(selectedDept?.subareas ?? []).map((s) => ({
                value: s.id,
                label: s.name,
              }))}
              value={form.subareaId}
              onChange={(e) => setForm((f) => ({ ...f, subareaId: e.target.value }))}
            />
          </ITGrid>
        </ITGrid>
      </ITCard>
    </ITPage>
  );
}
