import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { dyn, i18n } from "@shared/i18n";
import { useParams } from "react-router-dom";
import { usersApi, type User, type UserRole } from "@entities/user";
import { departmentsApi, type Department } from "@entities/department";

export const ROLE_GUIDANCE: Record<
  UserRole,
  { title: string; summary: string; actions: string[] }
> = {
  ADMIN: {
    title: "form.roles.ADMIN.title",
    summary: "form.roles.ADMIN.summary",
    actions: ["form.roles.ADMIN.actions.0", "form.roles.ADMIN.actions.1", "form.roles.ADMIN.actions.2"],
  },
  GERENTE: {
    title: "form.roles.GERENTE.title",
    summary: "form.roles.GERENTE.summary",
    actions: ["form.roles.GERENTE.actions.0", "form.roles.GERENTE.actions.1", "form.roles.GERENTE.actions.2"],
  },
  JEFE_DE_AREA: {
    title: "form.roles.JEFE_DE_AREA.title",
    summary: "form.roles.JEFE_DE_AREA.summary",
    actions: ["form.roles.JEFE_DE_AREA.actions.0", "form.roles.JEFE_DE_AREA.actions.1", "form.roles.JEFE_DE_AREA.actions.2"],
  },
  EMPLEADO: {
    title: "form.roles.EMPLEADO.title",
    summary: "form.roles.EMPLEADO.summary",
    actions: ["form.roles.EMPLEADO.actions.0", "form.roles.EMPLEADO.actions.1", "form.roles.EMPLEADO.actions.2"],
  },
  RECURSOS_HUMANOS: {
    title: "form.roles.RECURSOS_HUMANOS.title",
    summary: "form.roles.RECURSOS_HUMANOS.summary",
    actions: [
      "form.roles.RECURSOS_HUMANOS.actions.0",
      "form.roles.RECURSOS_HUMANOS.actions.1",
      "form.roles.RECURSOS_HUMANOS.actions.2",
    ],
  },
};

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "ADMIN" },
  { value: "GERENTE", label: "GERENTE" },
  { value: "JEFE_DE_AREA", label: "JEFE DE AREA" },
  { value: "EMPLEADO", label: "EMPLEADO" },
  { value: "RECURSOS_HUMANOS", label: "RECURSOS HUMANOS" },
];

export interface UserFormValues {
  username: string;
  email: string;
  password: string;
  name: string;
  segundoNombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  role: UserRole;
  numeroEmpleado: string;
  puesto: string;
  departmentId: string;
  subareaId: string;
}

/** Compone el nombre completo "name" (para el modelo User) desde los campos separados. */
export const composeFullName = (v: {
  name?: string;
  segundoNombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
}): string =>
  [v.name, v.segundoNombre, v.apellidoPaterno, v.apellidoMaterno]
    .filter(Boolean)
    .join(" ")
    .trim();

/** Divide un nombre completo almacenado en "name" a sus campos separados (fallback para datos viejos). */
const splitStoredName = (full: string): Pick<UserFormValues, "name" | "segundoNombre" | "apellidoPaterno" | "apellidoMaterno"> => {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { name: parts[0], segundoNombre: "", apellidoPaterno: "", apellidoMaterno: "" };
  return {
    name: parts[0],
    segundoNombre: "",
    apellidoPaterno: parts.slice(1).join(" "),
    apellidoMaterno: "",
  };
};

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
    segundoNombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
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
          const nameParts = splitStoredName(u.name);
          setForm({
            username: u.username,
            email: u.email ?? "",
            password: "",
            name: nameParts.name,
            segundoNombre: u.segundoNombre ?? nameParts.segundoNombre ?? "",
            apellidoPaterno: u.apellidoPaterno ?? nameParts.apellidoPaterno ?? "",
            apellidoMaterno: u.apellidoMaterno ?? nameParts.apellidoMaterno ?? "",
            role: u.role,
            numeroEmpleado: u.numeroEmpleado ?? "",
            puesto: u.puesto ?? "",
            departmentId: u.departmentId ?? "",
            subareaId: u.subareaId ?? "",
          });
        })
        .catch(() => {
          setError(i18n.t("users:form.errorLoad"));
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const selectedDept = departments.find((d) => d.id === form.departmentId);
  const roleGuidance = {
    title: dyn(tt)(ROLE_GUIDANCE[form.role].title),
    summary: dyn(tt)(ROLE_GUIDANCE[form.role].summary),
    actions: ROLE_GUIDANCE[form.role].actions.map((a) => dyn(tt)(a)),
  };

  const handleField = (field: keyof UserFormValues, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleDepartmentChange = (value: string) => {
    setForm((f) => ({ ...f, departmentId: value, subareaId: "" }));
  };

  const handleSubmit = async (): Promise<boolean> => {
    if (!form.username || !form.name) return false;
    if (!isEdit && !form.password) return false;
    const fullName = composeFullName(form);
    setSaving(true);
    try {
      if (isEdit) {
        await usersApi.update(id!, {
          username: form.username,
          email: form.email || null,
          name: fullName,
          segundoNombre: form.segundoNombre || null,
          apellidoPaterno: form.apellidoPaterno || null,
          apellidoMaterno: form.apellidoMaterno || null,
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
          name: fullName,
          segundoNombre: form.segundoNombre || undefined,
          apellidoPaterno: form.apellidoPaterno || undefined,
          apellidoMaterno: form.apellidoMaterno || undefined,
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