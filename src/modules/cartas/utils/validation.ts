import type { CartaResponsiva } from "@core/store/cartas/types";

export interface CartaFormErrors {
  numeroEmpleado?: string;
  descripcion?: string;
  marca?: string;
  modelo?: string;
  controlActivos?: string;
}

const text = (v?: string): string => (v ?? "").trim();

export function validateCartaDraft(draft: CartaResponsiva): CartaFormErrors {
  const errors: CartaFormErrors = {};

  if (!text(draft.numeroEmpleado)) {
    errors.numeroEmpleado = "El número de empleado es requerido";
  }

  const item = draft.items[0];
  if (!item) {
    errors.descripcion = "Agrega al menos un recurso TIC";
    return errors;
  }
  if (!text(item.descripcion)) {
    errors.descripcion = "La descripción es requerida";
  }
  if (!text(item.marca)) {
    errors.marca = "La marca es requerida";
  }
  if (!text(item.modelo)) {
    errors.modelo = "El modelo es requerido";
  }
  if (!text(item.controlActivos)) {
    errors.controlActivos = "El control de activos es requerido";
  }

  return errors;
}