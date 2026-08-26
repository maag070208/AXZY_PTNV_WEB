import type { CartaResponsiva } from "@core/store/cartas/types";

export interface CartaFormErrors {
  numeroEmpleado?: string;
  responsableId?: string;
  deviceId?: string;
}

const text = (v?: string): string => (v ?? "").trim();

export function validateCartaDraft(draft: CartaResponsiva): CartaFormErrors {
  const errors: CartaFormErrors = {};

  if (!draft.responsableId) {
    errors.responsableId = "Selecciona el empleado que recibe el equipo";
  }
  if (!text(draft.numeroEmpleado)) {
    errors.numeroEmpleado = "El número de empleado es requerido";
  }

  const item = draft.items[0];
  if (!item) {
    errors.deviceId = "Agrega al menos un recurso TIC";
    return errors;
  }
  if (!item.deviceId) {
    errors.deviceId = "Selecciona un dispositivo existente";
  }

  return errors;
}
