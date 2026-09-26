import { api } from "@shared/api/client";

export interface SysConfig {
  id: string;
  key: string;
  value: string;
  description?: string | null;
  updatedAt: string;
  updatedById?: string | null;
  updatedBy?: { id: string; name: string } | null;
}

const EMAIL_KEY = "EMAIL_NOTIFICATION_RECIPIENTS";
const SEND_EMAIL_KEY = "ENABLE_SEND_EMAIL";

export const sysConfigApi = {
  list: () => api.get<SysConfig[]>("/sys-config"),
  get: (key: string) => api.get<SysConfig>(`/sys-config/${key}`),
  update: (key: string, value: string, description?: string) =>
    api.put<SysConfig>(`/sys-config/${key}`, { value, description }),
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
  /** Interruptor global de correo transaccional (`ENABLE_SEND_EMAIL`). */
  getSendEmail: () => sysConfigApi.get(SEND_EMAIL_KEY),
  setSendEmail: (enabled: boolean) =>
    sysConfigApi.update(
      SEND_EMAIL_KEY,
      enabled ? "true" : "false",
      "Interruptor global de correo transaccional"
    ),
};