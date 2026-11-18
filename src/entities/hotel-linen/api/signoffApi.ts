import { api } from "@shared/api/client";
import { tableRequest, type ITDataTableFetchParamsPost } from "@shared/api/table";
import type { SignoffInput, SignoffRow, TransferSignoffDetail } from "../model/signoffTypes";

const BASE = "/hotel/linen";

export const signoffApi = {
  table: (params: ITDataTableFetchParamsPost) => tableRequest<SignoffRow>(`${BASE}/transfers/signoff/table`, params),
  /** Detalle del traspaso (líneas contadas, firmas y conformidad). */
  detail: (id: string) => api.get<TransferSignoffDetail>(`${BASE}/transfers/${id}`),
  sign: (id: string, input: SignoffInput) => api.post<unknown>(`${BASE}/transfers/${id}/signoff`, input),
};
