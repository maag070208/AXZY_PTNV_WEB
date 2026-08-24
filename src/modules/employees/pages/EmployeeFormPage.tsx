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
import { usersApi } from "@core/api/auth.api";
import {
  departmentsApi,
  type Department,
} from "@core/api/departments.api";

export default function EmployeeFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({
    name: "",
    numeroEmpleado: "",
    puesto: "",
    departmentId: "",
    subareaId: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    departmentsApi
      .list(true)
      .then((d) => {
        setDepartments(d);
        return isEdit && id ? usersApi.get(id) : null;
      })
      .then((u) => {
        if (u) {
          setForm({
            name: u.name,
            numeroEmpleado: u.numeroEmpleado ?? "",
            puesto: u.puesto ?? "",
            departmentId: u.departmentId ?? "",
            subareaId: "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const selectedDept = departments.find((d) => d.id === form.departmentId);

  const handleSubmit = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (isEdit && id) {
        await usersApi.update(id, {
          name: form.name,
          numeroEmpleado: form.numeroEmpleado || undefined,
          puesto: form.puesto || undefined,
          departmentId: form.departmentId || null,
          subareaId: form.subareaId || null,
        });
      }
      navigate("/empleados");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ITPage
        title="Empleados"
        loading
        backAction={() => navigate(-1)}
        breadcrumbs={[
          { label: "Empleados", onClick: () => navigate("/empleados") },
          { label: "Editar" },
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
      <ITButton variant="outlined" onClick={() => navigate("/empleados")}>
        Cancelar
      </ITButton>
      <ITButton
        variant="filled"
        color="primary"
        onClick={handleSubmit}
        disabled={saving || !form.name}
      >
        <ITFlex align="center" gap={1}>
          <FaSave size={12} />
          <ITText className="font-bold text-[11px]">
            {saving ? "Guardando…" : "Guardar"}
          </ITText>
        </ITFlex>
      </ITButton>
    </ITFlex>
  );

  return (
    <ITPage
      title="Editar empleado"
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: "Empleados", onClick: () => navigate("/empleados") },
        { label: "Editar" },
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
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="emp_name"
              label="Nombre *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="emp_num"
              label="No. Empleado"
              value={form.numeroEmpleado}
              onChange={(e) => setForm((f) => ({ ...f, numeroEmpleado: e.target.value }))}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="emp_puesto"
              label="Puesto"
              value={form.puesto}
              onChange={(e) => setForm((f) => ({ ...f, puesto: e.target.value }))}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITSelect
              name="emp_dept"
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
              name="emp_sub"
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
