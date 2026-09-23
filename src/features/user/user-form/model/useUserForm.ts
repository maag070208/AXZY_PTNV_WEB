import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { dyn, i18n } from "@shared/i18n";
import { useParams } from "react-router-dom";
import { usersApi, type User, type UserRole } from "@entities/user";
import { departmentsApi, type Department } from "@entities/department";
import { validateEmail } from "@shared/validation";
import { showToast } from "@app/toast/toast.slice";
import type { AppDispatch } from "@app/store";

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

/** Límites de caracteres por campo (los mismos que aplica la validación). */
const LIMITS = {
  username: { min: 3, max: 30 },
  password: { min: 6, max: 72 },
  name: { max: 100 },
  numeroEmpleado: { max: 30 },
  puesto: { max: 100 },
} as const;

const VALIDATED_FIELDS: (keyof UserFormValues)[] = [
  "username",
  "password",
  "email",
  "name",
  "numeroEmpleado",
  "puesto",
];

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
  const dispatch = useDispatch<AppDispatch>();

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
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    // Al escribir se limpia el error del campo; reaparece al salir (blur) o al guardar.
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const setFieldError = (field: keyof UserFormValues, message: string | null) => {
    setErrors((prev) => {
      if (!message) {
        if (!(field in prev)) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: message };
    });
  };

  /** Valida un solo campo (min/máx de caracteres, formato, obligatorios). */
  const validateField = (field: keyof UserFormValues, value: string): string | null => {
    const trimmed = value.trim();
    switch (field) {
      case "username":
        if (!trimmed) return "El usuario es obligatorio";
        if (trimmed.length < LIMITS.username.min)
          return `El usuario debe tener al menos ${LIMITS.username.min} caracteres`;
        if (trimmed.length > LIMITS.username.max)
          return `El usuario debe tener máximo ${LIMITS.username.max} caracteres`;
        return null;
      case "password":
        if (!isEdit && !value) return "La contraseña es obligatoria";
        if (value && value.length < LIMITS.password.min)
          return `La contraseña debe tener al menos ${LIMITS.password.min} caracteres`;
        if (value.length > LIMITS.password.max)
          return `La contraseña debe tener máximo ${LIMITS.password.max} caracteres`;
        return null;
      case "name":
        if (!trimmed) return "El nombre es obligatorio";
        if (trimmed.length > LIMITS.name.max)
          return `El nombre debe tener máximo ${LIMITS.name.max} caracteres`;
        return null;
      case "email":
        if (!trimmed) return null;
        if (trimmed.length > 254) return "El correo debe tener máximo 254 caracteres";
        return validateEmail(trimmed);
      case "numeroEmpleado":
        if (trimmed.length > LIMITS.numeroEmpleado.max)
          return `El número de empleado debe tener máximo ${LIMITS.numeroEmpleado.max} caracteres`;
        return null;
      case "puesto":
        if (trimmed.length > LIMITS.puesto.max)
          return `El puesto debe tener máximo ${LIMITS.puesto.max} caracteres`;
        return null;
      default:
        return null;
    }
  };

  const handleBlur = (field: keyof UserFormValues) => {
    setFieldError(field, validateField(field, form[field] ?? ""));
  };

  const handleDepartmentChange = (value: string) => {
    setForm((f) => ({ ...f, departmentId: value, subareaId: "" }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    for (const field of VALIDATED_FIELDS) {
      const err = validateField(field, form[field] ?? "");
      if (err) e[field] = err;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (): Promise<boolean> => {
    if (!validate()) return false;
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
      const code: unknown = e?.code;
      const msg: string = e?.message ?? "Error al guardar";
      // Duplicados que manda la API → error inline en el campo + toast global.
      if (code === "EMAIL_TAKEN" || code === "USERNAME_TAKEN" || code === "NUMERO_EMPLEADO_TAKEN") {
        const field =
          code === "EMAIL_TAKEN" ? "email" : code === "USERNAME_TAKEN" ? "username" : "numeroEmpleado";
        setFieldError(field, msg);
        dispatch(showToast({ message: msg, type: "error" }));
      } else {
        setError(msg);
      }
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
    errors,
    handleField,
    handleBlur,
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