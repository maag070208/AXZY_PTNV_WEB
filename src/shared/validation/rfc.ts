/**
 * Lite RFC validator (Mexico). Allows null/empty.
 * Returns null when valid, otherwise an error message in Spanish.
 */
export const validateRfc = (value: string | null | undefined): string | null => {
  if (value == null || value.trim() === "") return null;
  const v = value.trim().toUpperCase();
  // Persona física (13) o moral (12). No validamos homoclave ni dígito verificador.
  const regex = /^([A-ZÑ&]{3,4})\d{6}([A-Z0-9]{3})$/;
  return regex.test(v) ? null : "RFC inválido (formato esperado: 4 letras + 6 dígitos + 3 caracteres)";
};
