import { api } from "@shared/api/client";
import type {
  EmployeeSyncConfirmInput,
  EmployeeSyncConfirmResult,
  EmployeeSyncPreview,
  EmployeeSyncReportRow,
} from "../model/syncTypes";

/**
 * Sincronización de empleados desde el Excel de nómina.
 *
 * La previsualización no escribe nada; la confirmación aplica exactamente lo
 * revisado en pantalla (con el usuario, contraseña y horario elegidos para cada
 * alta). El reporte se descarga como Excel generado por la API.
 */
export const employeeSyncApi = {
  /** Lee el archivo y propone altas, bajas, cambios y filas por resolver. */
  preview: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<EmployeeSyncPreview>(`/users/sync/preview`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  /** Aplica la sincronización (todo o nada) sobre el sistema y los relojes. */
  confirm: (input: EmployeeSyncConfirmInput) =>
    api.post<EmployeeSyncConfirmResult>(`/users/sync/confirm`, input),

  /** Genera el Excel del reporte final con las filas dadas. */
  exportReport: (rows: EmployeeSyncReportRow[]) =>
    api.post<Blob>(`/users/sync/export`, { rows }, { responseType: "blob" }),
};
