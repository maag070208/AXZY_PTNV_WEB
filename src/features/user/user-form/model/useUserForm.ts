import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { dyn, i18n } from "@shared/i18n";
import { useParams } from "react-router-dom";
import { isStaffRole, useRolesCatalog, usersApi, type User, type UserRole } from "@entities/user";
import { departmentsApi, type Department } from "@entities/department";
import { personalApi, type DocumentType } from "@entities/hr";
import { validateEmail } from "@shared/validation";
import { showToast } from "@app/toast/toast.slice";
import type { AppDispatch } from "@app/store";

export const ROLE_GUIDANCE: Record<
  UserRole,
  { title: string; summary: string; actions: string[] }
> = {
  GENERIC: {
    title: "form.roles.GENERIC.title",
    summary: "form.roles.GENERIC.summary",
    actions: ["form.roles.GENERIC.actions.0", "form.roles.GENERIC.actions.1"],
  },
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
  CHEF: {
    title: "form.roles.CHEF.title",
    summary: "form.roles.CHEF.summary",
    actions: ["form.roles.CHEF.actions.0", "form.roles.CHEF.actions.1", "form.roles.CHEF.actions.2"],
  },
};

export interface UserFormValues {
  username: string;
  email: string;
  password: string;
  name: string;
  middleName: string;
  paternalSurname: string;
  maternalSurname: string;
  role: UserRole;
  /** Roles adicionales (multi-rol). El principal es `role`. */
  roles: string[];
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

/**
 * Formulario de cuenta. Sin argumentos toma el id de la ruta (`/users/:id/edit`,
 * `/users/new`); el diálogo de edición le pasa el id explícito porque vive en la
 * lista, fuera de esa ruta.
 */
export const useUserForm = (userId?: string) => {
  const { id: routeId } = useParams<{ id: string }>();
  const id = userId ?? routeId;
  const isEdit = Boolean(id);
  const { t: tt } = useTranslation(["users", "common"]);
  const dispatch = useDispatch<AppDispatch>();
  const rolesCatalog = useRolesCatalog();

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
    roles: [],
    employeeNumber: "",
    jobTitle: "",
    departmentId: "",
    subareaId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Documentación obligatoria del alta (tipos marcados `required` en el catálogo).
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
            roles: (u.extraRoles ?? []).map((extra) => extra.role),
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

  /** En el alta de un rol con expediente (personal) se exigen los documentos obligatorios. */
  const requiresDocs = !isEdit && isStaffRole(form.role);
  // Los obligatorios los marca RH en el catálogo de documentos (`required`).
  const requiredDocs = documentTypes
    .filter((d) => d.required && d.active)
    .map((d) => ({ key: d.id, label: d.name, typeId: d.id as string | null }));
  const setDocFile = (key: string, file: File | null) =>
    setDocsFiles((prev) => ({ ...prev, [key]: file }));
  const missingDocs = requiredDocs.filter((d) => !docsFiles[d.key]);
  const guidance = ROLE_GUIDANCE[form.role] ?? ROLE_GUIDANCE.GENERIC;
  const roleGuidance = {
    title: dyn(tt)(guidance.title),
    summary: dyn(tt)(guidance.summary),
    actions: guidance.actions.map((a) => dyn(tt)(a)),
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
        if (!trimmed) return i18n.t("users:form.validation.usernameRequired");
        if (trimmed.length < LIMITS.username.min)
          return i18n.t("users:form.validation.usernameMin", { min: LIMITS.username.min });
        if (trimmed.length > LIMITS.username.max)
          return i18n.t("users:form.validation.usernameMax", { max: LIMITS.username.max });
        return null;
      case "password":
        if (!isEdit && !value) return i18n.t("users:form.validation.passwordRequired");
        if (value && value.length < LIMITS.password.min)
          return i18n.t("users:form.validation.passwordMin", { min: LIMITS.password.min });
        if (value.length > LIMITS.password.max)
          return i18n.t("users:form.validation.passwordMax", { max: LIMITS.password.max });
        return null;
      case "name":
        if (!trimmed) return i18n.t("users:form.validation.nameRequired");
        if (trimmed.length > LIMITS.name.max)
          return i18n.t("users:form.validation.nameMax", { max: LIMITS.name.max });
        return null;
      case "email":
        if (!trimmed) return null;
        if (trimmed.length > 254) return i18n.t("users:form.validation.emailMax", { max: 254 });
        return validateEmail(trimmed);
      case "employeeNumber":
        if (trimmed.length > LIMITS.employeeNumber.max)
          return i18n.t("users:form.validation.employeeNumberMax", { max: LIMITS.employeeNumber.max });
        return null;
      case "jobTitle":
        if (trimmed.length > LIMITS.jobTitle.max)
          return i18n.t("users:form.validation.jobTitleMax", { max: LIMITS.jobTitle.max });
        return null;
      default:
        return null;
    }
  };

  const handleBlur = (field: keyof UserFormValues) => {
    setFieldError(field, validateField(field, String(form[field] ?? "")));
  };

  const handleDepartmentChange = (value: string) => {
    setForm((f) => ({ ...f, departmentId: value, subareaId: "" }));
  };

  /** Alterna un rol adicional (multi-rol). El principal no se repite aquí. */
  const toggleExtraRole = (role: string, checked: boolean) => {
    setForm((f) => ({
      ...f,
      roles: checked
        ? [...new Set([...f.roles, role])]
        : f.roles.filter((item) => item !== role),
    }));
  };

  /**
   * Campos que edita el expediente (`/employees/:id/edit`): identidad y datos
   * laborales. Este formulario solo los captura al dar de alta o para una cuenta
   * sin expediente; con expediente ni se validan ni se mandan.
   */
  const RECORD_FIELDS: (keyof UserFormValues)[] = ["name", "email", "employeeNumber", "jobTitle"];

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    for (const field of VALIDATED_FIELDS) {
      // Los campos que se editan en el expediente no se validan aquí: si algo
      // viniera mal del respaldo, el usuario no tendría dónde verlo ni corregirlo.
      if (!editsPerson && RECORD_FIELDS.includes(field)) continue;
      const err = validateField(field, String(form[field] ?? ""));
      if (err) e[field] = err;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /**
   * Índice del paso con el primer campo inválido, contando los pasos que
   * realmente se muestran: sin expediente no hay paso de datos de la persona, así
   * que acceso pasa a ser el 0.
   */
  const firstInvalidStep = (): number => {
    const withErrors = new Set(Object.keys(errors));
    const invalid = (field: keyof UserFormValues): boolean =>
      withErrors.has(field) || Boolean(validateField(field, String(form[field] ?? "")));

    // Paso de la persona (nombre, correo y datos laborales): solo si se edita aquí.
    if (editsPerson) {
      for (const field of RECORD_FIELDS) {
        if (VALIDATED_FIELDS.includes(field) && invalid(field)) return 0;
      }
    }
    // Acceso (usuario y contraseña).
    for (const field of ["username", "password"] as (keyof UserFormValues)[]) {
      if (invalid(field)) return editsPerson ? 1 : 0;
    }
    if (requiresDocs && missingDocs.length > 0) return editsPerson ? 3 : 2;
    return -1;
  };

  const handleSubmit = async (): Promise<boolean> => {
    if (requiresDocs && missingDocs.length > 0) {
      setDocsError(i18n.t("users:form.docsRequired", { docs: requiredDocs.map((d) => d.label).join(", ") }));
      return false;
    }
    if (!validate()) return false;
    setDocsError(null);
    const fullName = composeFullName(form);
    setSaving(true);
    try {
      if (isEdit) {
        // Con expediente, la identidad y los datos laborales los guarda el
        // expediente: aquí no se mandan para no pisarlos desde dos lugares.
        await usersApi.update(id!, {
          username: form.username,
          ...(editsPerson
            ? {
                email: form.email || null,
                name: fullName,
                middleName: form.middleName || null,
                paternalSurname: form.paternalSurname || null,
                maternalSurname: form.maternalSurname || null,
              }
            : {}),
          role: form.role,
          roles: form.roles.filter((r) => r !== form.role),
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
          roles: form.roles.filter((r) => r !== form.role),
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
      const msg: string = e?.message ?? i18n.t("common:errors.save");
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

  /**
   * ¿La cuenta tiene expediente de personal? Lo tiene si alguno de sus roles es
   * `staff`. Manda en la separación de pantallas: los datos de la persona
   * (nombre, correo, domicilio…) se editan en el expediente, y aquí solo se
   * capturan al dar de alta o para las cuentas sin expediente, que no tienen
   * otro lugar donde editarlos.
   */
  const hasRecord = isStaffRole(form.role) || form.roles.some((extra) => isStaffRole(extra));

  /**
   * ¿Este formulario edita los datos de la persona (nombre, apellidos, correo)?
   * Sí al dar de alta (se necesitan para crear la persona) y siempre que la
   * cuenta no tenga expediente, que es su único lugar. Si tiene expediente, esos
   * campos viven en `/employees/:id/edit` y aquí solo se muestran los laborales.
   */
  const editsPerson = !isEdit || !hasRecord;

  return {
    isEdit,
    id,
    hasRecord,
    editsPerson,
    departments,
    form,
    errors,
    handleField,
    handleBlur,
    handleDepartmentChange,
    toggleExtraRole,
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
    ROLE_OPTIONS: rolesCatalog
      .filter((role) => role.active)
      .map((role) => ({ value: role.key, label: role.name })),
    EXTRA_ROLE_OPTIONS: rolesCatalog
      .filter((role) => role.active && role.key !== form.role)
      .map((role) => ({ value: role.key, label: role.name })),
  };
};