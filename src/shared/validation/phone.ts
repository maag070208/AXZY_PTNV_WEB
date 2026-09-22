/**
 * Phone validator: 10 a 13 dígitos, permite prefijo "+" y espacios. Allows null/empty.
 */
export const validatePhone = (value: string | null | undefined): string | null => {
  if (value == null || value.trim() === "") return null;
  const digits = value.replace(/[^\d]/g, "");
  if (digits.length < 10 || digits.length > 13) {
    return "Teléfono debe tener entre 10 y 13 dígitos";
  }
  return null;
};
