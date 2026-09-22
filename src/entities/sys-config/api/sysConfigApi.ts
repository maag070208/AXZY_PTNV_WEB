import { api } from "@shared/api/client";

export interface SysConfig {
  id: string;
  key: string;
  value: string;
  descripcion?: string | null;
  updatedAt: string;
  updatedById?: string | null;
  updatedBy?: { id: string; name: string } | null;
}

const EMAIL_KEY = "EMAIL_NOTIFICATION_RECIPIENTS";

export const sysConfigApi = {
  list: () => api.get<SysConfig[]>("/sys-config"),
  get: (key: string) => api.get<SysConfig>(`/sys-config/${key}`),
  update: (key: string, value: string, descripcion?: string) =>
    api.put<SysConfig>(`/sys-config/${key}`, { value, descripcion }),
  remove: (key: string) => api.delete<void>(`/sys-config/${key}`),
  /**
   * Atajo para la única clave que edita el panel de notificaciones.
   * El listado por defecto (`/sys-config`) requiere ADMIN, así que en
   * pantallas de GERENTE/JEFE_DE_AREA no se cargan todos los registros;
   * el endpoint por clave está abierto a cualquier usuario autenticado.
   */
  getEmailRecipients: () => sysConfigApi.get(EMAIL_KEY),
  setEmailRecipients: (value: string) =>
    sysConfigApi.update(
      EMAIL_KEY,
      value,
      "Destinatarios copias en notificaciones de sistema (separados por coma)"
    ),
};