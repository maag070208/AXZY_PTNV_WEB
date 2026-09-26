/** Filtros y orden que una tabla server-side ya aplicó a su última consulta. */
export interface TableQuery {
  filters: Record<string, string | number | boolean>;
  sort: { key: string; direction: "asc" | "desc" };
}

/**
 * Traduce los filtros de columna vigentes a pares etiqueta/valor para el pie de
 * un PDF. La etiqueta la resuelve quien llama (cada pestaña tiene su propio
 * namespace i18n), así que aquí sólo se ordena y se descartan las claves que no
 * tienen traducción.
 */
export const appliedFilters = (
  filters: Record<string, string | number | boolean>,
  labels: Record<string, string>,
  t: (key: string) => string
): Array<{ label: string; value: string }> =>
  Object.entries(filters)
    .filter(([key, value]) => labels[key] !== undefined && value !== "" && value != null)
    .map(([key, value]) => ({ label: t(labels[key]), value: String(value) }));
