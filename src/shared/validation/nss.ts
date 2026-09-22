/** NSS lite: 11 dígitos. Allows null/empty. */
export const validateNss = (value: string | null | undefined): string | null => {
  if (value == null || value.trim() === "") return null;
  const v = value.trim();
  return /^\d{11}$/.test(v) ? null : "NSS debe tener 11 dígitos";
};
