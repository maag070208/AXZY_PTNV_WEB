export const STATUS_BADGE: Record<string, { color: string }> = {
  ABIERTO: { color: "warning" },
  EN_SEGUIMIENTO: { color: "info" },
  CERRADO: { color: "success" },
};

export const PRIORITY_BADGE: Record<string, { color: string }> = {
  BAJA: { color: "default" },
  MEDIA: { color: "warning" },
  ALTA: { color: "danger" },
  URGENTE: { color: "danger" },
};

export const STATUS_KEYS = Object.keys(STATUS_BADGE);
export const PRIORITY_KEYS = Object.keys(PRIORITY_BADGE);

export const CATEGORY_KEYS = ["MANTENIMIENTO", "EQUIPO", "SISTEMA", "OTRO"] as const;