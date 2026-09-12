export const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  ABIERTO: { color: "warning", label: "Abierto" },
  EN_SEGUIMIENTO: { color: "info", label: "En seguimiento" },
  CERRADO: { color: "success", label: "Cerrado" },
};

export const PRIORITY_BADGE: Record<string, { color: string; label: string }> = {
  BAJA: { color: "default", label: "Baja" },
  MEDIA: { color: "warning", label: "Media" },
  ALTA: { color: "danger", label: "Alta" },
  URGENTE: { color: "danger", label: "Urgente" },
};

export const CATEGORY_LABELS: Record<string, string> = {
  MANTENIMIENTO: "Mantenimiento",
  EQUIPO: "Equipo",
  SISTEMA: "Sistema",
  OTRO: "Otro",
};

export const STATUS_LABELS: Record<string, string> = {
  ABIERTO: "Abierto",
  EN_SEGUIMIENTO: "En seguimiento",
  CERRADO: "Cerrado",
};