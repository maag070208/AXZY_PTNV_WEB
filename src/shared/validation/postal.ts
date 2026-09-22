/** Postal code (México): 5 dígitos. Allows null/empty. */
export const validatePostal = (value: string | null | undefined): string | null => {
  if (value == null || value.trim() === "") return null;
  return /^\d{5}$/.test(value.trim()) ? null : "Código postal debe tener 5 dígitos";
};
