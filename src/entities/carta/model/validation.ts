import type { CartaResponsiva } from "./types";

export interface CartaFormErrors {
  numeroEmpleado?: string;
  responsableId?: string;
  ubicacion?: string;
  deviceId?: string;
}

const text = (v?: string): string => (v ?? "").trim();

export function validateCartaDraft(draft: CartaResponsiva): CartaFormErrors {
  const errors: CartaFormErrors = {};

  const esUbicacion =
    draft.responsableTipo === "UBICACION" || Boolean(draft.ubicacionId);

  if (esUbicacion) {
    // Modo ubicación: la carta se asigna a un lugar (no a un empleado).
    if (!draft.ubicacionId) {
      errors.ubicacion = "form.errUbicacion";
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