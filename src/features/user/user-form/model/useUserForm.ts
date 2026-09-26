import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { dyn, i18n } from "@shared/i18n";
import { useParams } from "react-router-dom";
import { ROLE_LABELS, usersApi, type User, type UserRole } from "@entities/user";
import { departmentsApi, type Department } from "@entities/department";
import { personalApi, type DocumentType } from "@entities/hr";
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
  MANAGER: {
    title: "form.roles.MANAGER.title",
    summary: "form.roles.MANAGER.summary",
    actions: ["form.roles.MANAGER.actions.0", "form.roles.MANAGER.actions.1", "form.roles.MANAGER.actions.2"],
  },
  AREA_HEAD: {
    title: "form.roles.AREA_HEAD.title",
    summary: "form.roles.AREA_HEAD.summary",
    actions: ["form.roles.AREA_HEAD.actions.0", "form.roles.AREA_HEAD.actions.1", "form.roles.AREA_HEAD.actions.2"],
  },
  EMPLOYEE: {
    title: "form.roles.EMPLOYEE.title",
    summary: "form.roles.EMPLOYEE.summary",
    actions: ["form.roles.EMPLOYEE.actions.0", "form.roles.EMPLOYEE.actions.1", "form.roles.EMPLOYEE.actions.2"],
  },
  HUMAN_RESOURCES: {
    title: "form.roles.HUMAN_RESOURCES.title",
    summary: "form.roles.HUMAN_RESOURCES.summary",
    actions: [
      "form.roles.HUMAN_RESOURCES.actions.0",
      "form.roles.HUMAN_RESOURCES.actions.1",
      "form.roles.HUMAN_RESOURCES.actions.2",
    ],
  },
  GUARD: {
    title: "form.roles.GUARD.title",
    summary: "form.roles.GUARD.summary",
    actions: ["form.roles.GUARD.actions.0", "form.roles.GUARD.actions.1", "form.roles.GUARD.actions.2"],
  },
};

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as UserRole[]).map((value) => ({
  value,
  label: ROLE_LABELS[value],
}));

/** Documentación obligatoria del alta de un empleado (se resuelve por nombre). */
export const REQUIRED_DOCS: Array<{ key: string; test: RegExp; fallback: string }> = [
  { key: "ineFrente", test: /ine.*frente|frente.*ine/i, fallback: "INE (Frente)" },
  { key: "ineReverso", test: /ine.*reverso|reverso.*ine/i, fallback: "INE (Reverso)" },
  { key: "comprobante", test: /domicilio/i, fallback: "Comprobante de Domicilio" },
];

export interface UserFormValues {
  username: string;
  email: string;
  password: string;
  name: string;
  middleName: string;
  paternalSurname: string;
  maternalSurname: string;
  role: UserRole;
  employeeNumber: string;
  jobTitle: string;
  departmentId: string;
  subareaId: string;
}

/** Límites de caracteres por campo (los mismos que aplica la validación). */
const LIMITS = {
  username: { min: 3, max: 30 },
  password: { min: 6, max: 72 },
  name: { max: 100 },
  employeeNumber: { max: 30 },
  jobTitle: { max: 100 },
} as const;

const VALIDATED_FIELDS: (keyof UserFormValues)[] = [
  "username",
  "password",
  "email",
  "name",
  "employeeNumber",
  "jobTitle",
];

/** Paso del stepper al que pertenece cada campo validado (0=datos personales, 1=acceso). */
const FIELD_STEP: Record<string, number> = {
  username: 1,
  password: 1,
  email: 0,
  name: 0,
  employeeNumber: 0,
  jobTitle: 0,
};

/** Compone el nombre completo "name" (para el modelo User) desde los campos separados. */
export const composeFullName = (v: {
  name?: string;
  middleName?: string;
  paternalSurname?: string;
  maternalSurname?: string;
}): string =>
  [v.name, v.middleName, v.paternalSurname, v.maternalSurname]
    .filter(Boolean)
    .join(" ")
    .trim();

/** Divide un nombre completo almacenado en "name" a sus campos separados (fallback para datos viejos). */
const splitStoredName = (full: string): Pick<UserFormValues, "name" | "middleName" | "paternalSurname" | "maternalSurname"> => {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { name: parts[0], middleName: "", paternalSurname: "", maternalSurname: "" };
  return {
    name: parts[0],
    middleName: "",
    paternalSurname: parts.slice(1).join(" "),
    maternalSurname: "",
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
    middleName: "",
    paternalSurname: "",
    maternalSurname: "",
    role: "EMPLOYEE",
    employeeNumber: "",
    jobTitle: "",
    departmentId: "",
    subareaId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Documentación obligatoria del alta (INE frente/reverso + comprobante).
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [docsFiles, setDocsFiles] = useState<Record<string, File | null>>({});
  const [docsError, setDocsError] = useState<string | null>(null);

  useEffect(() => {
    personalApi
      .documentTypes()
      .then(setDocumentTypes)
      .catch(() => setDocumentTypes([]));
  }, []);

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
            middleName: u.middleName ?? nameParts.middleName ?? "",
            paternalSurname: u.paternalSurname ?? nameParts.paternalSurname ?? "",
            maternalSurname: u.maternalSurname ?? nameParts.maternalSurname ?? "",
            role: u.role,
            employeeNumber: u.employeeNumber ?? "",
            jobTitle: u.jobTitle ?? "",
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

  /** En el alta de un empleado se exigen las 3 documentaciones. */
  const requiresDocs = !isEdit && form.role === "EMPLOYEE";
  const requiredDocs = REQUIRED_DOCS.map((r) => {
    const type = documentTypes.find((d) => r.test.test(d.name));
    return { key: r.key, label: type?.name ?? r.fallback, typeId: type?.id ?? null };
  });
  const setDocFile = (key: string, file: File | null) =>
    setDocsFiles((prev) => ({ ...prev, [key]: file }));
  const missingDocs = requiredDocs.filter((d) => !docsFiles[d.key]);
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
      case "employeeNumber":
        if (trimmed.length > LIMITS.employeeNumber.max)
          return `El número de empleado debe tener máximo ${LIMITS.employeeNumber.max} caracteres`;
        return null;
      case "jobTitle":
        if (trimmed.length > LIMITS.jobTitle.max)
          return `El puesto debe tener máximo ${LIMITS.jobTitle.max} caracteres`;
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

  /** Devuelve el paso (0=datos personales, 1=acceso) con el primer campo inválido; -1 si todo es válido. */
  const firstInvalidStep = (): number => {
    const withErrors = new Set(Object.keys(errors));
    for (let step = 0; step <= 1; step++) {
      for (const field of VALIDATED_FIELDS) {
        if (FIELD_STEP[field] !== step) continue;
        if (withErrors.has(field)) return step;
        if (validateField(field, form[field] ?? "")) return step;
      }
    }
    if (requiresDocs && missingDocs.length > 0) return 3;
    return -1;
  };

  const handleSubmit = async (): Promise<boolean> => {
    if (requiresDocs && missingDocs.length > 0) {
      setDocsError(i18n.t("users:form.docsRequired"));
      return false;
    }
    if (!validate()) return false;
    setDocsError(null);
    const fullName = composeFullName(form);
    setSaving(true);
    try {
      if (isEdit) {
        await usersApi.update(id!, {
          username: form.username,
          email: form.email || null,
          name: fullName,
          middleName: form.middleName || null,
          paternalSurname: form.paternalSurname || null,
          maternalSurname: form.maternalSurname || null,
          role: form.role,
          employeeNumber: form.employeeNumber || undefined,
          jobTitle: form.jobTitle || undefined,
          departmentId: form.departmentId || undefined,
          subareaId: form.subareaId || undefined,
        });
      } else {
        const created = await usersApi.create({
          username: form.username,
          email: form.email || undefined,
          password: form.password,
          name: fullName,
          middleName: form.middleName || undefined,
          paternalSurname: form.paternalSurname || undefined,
          maternalSurname: form.maternalSurname || undefined,
          role: form.role,
          employeeNumber: form.employeeNumber || undefined,
          jobTitle: form.jobTitle || undefined,
          departmentId: form.departmentId || undefined,
          subareaId: form.subareaId || undefined,
        });
        // Documentación obligatoria del alta.
        if (requiresDocs) {
          for (const d of requiredDocs) {
            const file = docsFiles[d.key];
            if (file && d.typeId) {
              await personalApi.uploadDocument(created.id, d.typeId, file);
            }
          }
          // Correo de alta con los documentos adjuntos (fire-and-forget).
          void personalApi.notifyRegistration(created.id).catch(() => undefined);
        }
      }
      return true;
    } catch (e: any) {
      const code: unknown = e?.code;
      const msg: string = e?.message ?? "Error al guardar";
      // Duplicados que manda la API → error inline en el campo + toast global.
      if (code === "EMAIL_TAKEN" || code === "USERNAME_TAKEN" || code === "EMPLOYEE_NUMBER_TAKEN") {
        const field =
          code === "EMAIL_TAKEN" ? "email" : code === "USERNAME_TAKEN" ? "username" : "employeeNumber";
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
    firstInvalidStep,
    canSubmit,
    // Documentación del alta
    requiresDocs,
    requiredDocs,
    docsFiles,
    setDocFile,
    docsError,
    tt,
    ROLE_OPTIONS,
  };
};