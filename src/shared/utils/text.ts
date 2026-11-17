/** Nombre propio en "Title Case" para mostrar (los datos vienen en mayúsculas). */
export const toTitleCase = (value: string | null | undefined): string =>
  (value ?? "")
    .split(/(\s+)/)
    .map((word) =>
      // Siglas como "A&B" o "TI": se dejan como vienen.
      /[&\d]/.test(word) || (word.length <= 2 && word === word.toLocaleUpperCase() && /\p{L}/u.test(word))
        ? word
        : word
            .toLocaleLowerCase()
            .replace(/(^|[-(])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toLocaleUpperCase()),
    )
    .join("");

/** Iniciales (máximo dos letras) de un nombre. */
export const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return ((parts[0][0] ?? "") + (parts.length > 1 ? (parts[1][0] ?? "") : "")).toLocaleUpperCase();
};
