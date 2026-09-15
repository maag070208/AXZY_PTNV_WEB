import type { CartaResponsiva } from "./types";

export interface CartaFormErrors {
  numeroEmpleado?: string;
  responsableId?: string;
  departmentId?: string;
  deviceId?: string;
}

const text = (v?: string): string => (v ?? "").trim();

export function validateCartaDraft(draft: CartaResponsiva): CartaFormErrors {
  const errors: CartaFormErrors = {};

  const esDepartamento =
    draft.responsableTipo === "DEPARTAMENTO" || Boolean(draft.departmentId);

  if (esDepartamento) {
    // Modo departamento: la carta se asigna a un departamento (no a un empleado).
    if (!draft.departmentId) {
      errors.departmentId = "form.errDepartment";
    }
  } else {
    if (!draft.responsableId) {
      errors.responsableId = "form.errResponsable";
    }
    if (!text(draft.numeroEmpleado)) {
      errors.numeroEmpleado = "form.errNumeroEmpleado";
    }
  }

  const item = draft.items[0];
  if (!item) {
    errors.deviceId = "form.errNoItem";
    return errors;
  }
  if (!item.deviceId) {
    errors.deviceId = "form.errDevice";
  }

  return errors;
}