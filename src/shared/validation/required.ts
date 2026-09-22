/** Non-empty helper. Returns null when valid, otherwise a Spanish error message. */
export const validateRequired = (value: string | null | undefined, label = "Este campo"): string | null => {
  if (value == null || value.trim() === "") return `${label} es obligatorio`;
  return null;
};

/** Minimum-length helper for strings. */
export const validateMinLength = (
  value: string | null | undefined,
  min: number,
  label = "Este campo"
): string | null => {
  if (value == null || value.trim() === "") return `${label} es obligatorio`;
  return value.length >= min ? null : `${label} debe tener al menos ${min} caracteres`;
};
