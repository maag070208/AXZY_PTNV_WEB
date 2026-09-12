import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { usersApi, type User, type UserRole } from "@entities/user";
import { departmentsApi, type Department } from "@entities/department";

export const ROLE_GUIDANCE: Record<
  UserRole,
  { title: string; summary: string; actions: string[] }
> = {
  ADMIN: {
    title: "Administrador del sistema",
    summary: "Control total de catálogos, usuarios, dispositivos, tickets y reportes.",
    actions: ["Configura permisos y usuarios", "Administra todos los departamentos", "Puede completar y cerrar tareas"],
  },
  GERENTE: {
    title: "Gerente",
    summary: "Supervisa tickets y tareas de su departamento.",
    actions: ["Crea y administra tickets", "Asigna responsables y tareas", "Puede completar tareas y cerrar tickets"],
  },
  JEFE_DE_AREA: {
    title: "Jefe de área",
    summary: "Da seguimiento operativo a los tickets de su departamento.",
    actions: ["Crea tickets", "Puede generar tareas de sus tickets", "Mueve tareas asignadas hasta revisión"],
  },
  EMPLEADO: {
    title: "Empleado",
    summary: "Ejecuta tareas asignadas y reporta avances.",
    actions: ["No crea tickets", "Solo ve tickets con tareas asignadas", "Mueve sus tareas hasta revisión"],
  },
};

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "ADMIN" },
  { value: "GERENTE", label: "GERENTE" },
  { value: "JEFE_DE_AREA", label: "JEFE DE AREA" },
  { value: "EMPLEADO", label: "EMPLEADO" },
];

export interface UserFormValues {
  username: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  numeroEmpleado: string;
  puesto: string;
  departmentId: string;
  subareaId: string;
}

export const useUserForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { t: tt } = useTranslation(["users", "common"]);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState<UserFormValues>({
    username: "",
    email: "",
    password: "",
    name: "",
    role: "EMPLEADO",
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
      usersApi
        .get(id)
        .then((u: User) => {
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
        })
        .catch(() => {
          setError("No se pudo cargar el usuario");
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const selectedDept = departments.find((d) => d.id === form.departmentId);
  const roleGuidance = ROLE_GUIDANCE[form.role];

  const handleField = (field: keyof UserFormValues, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleDepartmentChange = (value: string) => {
    setForm((f) => ({ ...f, departmentId: value, subareaId: "" }));
  };

  const handleSubmit = async (): Promise<boolean> => {
    if (!form.username || !form.name) return false;
    if (!isEdit && !form.password) return false;
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
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const canSubmit =
    !!form.username && !!form.name && (isEdit || !!form.password);

  return {
    isEdit,
    departments,
    form,
    handleField,
    handleDepartmentChange,
    selectedDept,
    roleGuidance,
    loading,
    saving,
    error,
    setError,
    handleSubmit,
    canSubmit,
    tt,
    ROLE_OPTIONS,
  };
};