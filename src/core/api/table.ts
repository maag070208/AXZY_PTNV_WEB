import { post } from "./client";

/**
 * Contrato ITDataTable (server-side). El frontend envía { page, limit, filters, sort }
 * y el backend responde { data, total }.
 */
export interface ITDataTableFetchParamsPost {
  page: number;
  limit: number;
  filters: Record<string, string | number | boolean>;
  sort?: { key: string; direction: "asc" | "desc" };
}

export interface ITDataTableResponse<T> {
  data: T[];
  total: number;
}

export const tableRequest = <T>(
  path: string,
  params: ITDataTableFetchParamsPost
): Promise<ITDataTableResponse<T>> => post<ITDataTableResponse<T>>(path, params);