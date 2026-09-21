import type { ITDataTableFetchParams, ITDataTableResponse } from "@axzydev/axzy_ui_system";

/**
 * Convierte un fetcher que regresa un arreglo completo en un `fetchData`
 * compatible con ITDataTable (paginación/filtro/orden client-side).
 */
export const makeClientTableFetch =
  <T>(fetcher: () => Promise<T[]>): ((params: ITDataTableFetchParams) => Promise<ITDataTableResponse<T>>) =>
  async (params) => {
    const all = await fetcher();
    let rows = [...all];

    const filters = params.filters ?? {};
    if (Object.keys(filters).length > 0) {
      rows = rows.filter((r) => {
        const row = r as Record<string, unknown>;
        return Object.entries(filters).every(([key, value]) => {
          if (!value) return true;
          const field = row[key];
          if (field == null) return false;
          return String(field).toLowerCase().includes(String(value).toLowerCase());
        });
      });
    }

    if (params.sort?.key) {
      const { key, direction } = params.sort;
      const mult = direction === "asc" ? 1 : -1;
      rows.sort((a, b) => {
        const av = (a as Record<string, unknown>)[key];
        const bv = (b as Record<string, unknown>)[key];
        if (av == null) return 1;
        if (bv == null) return -1;
        return String(av).localeCompare(String(bv), undefined, { numeric: true }) * mult;
      });
    }

    const total = rows.length;
    const start = (params.page - 1) * params.limit;
    return { data: rows.slice(start, start + params.limit), total };
  };