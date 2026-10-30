export const STATUS_BADGE: Record<string, { color: string }> = {
  OPEN: { color: "warning" },
  IN_PROGRESS: { color: "info" },
  CLOSED: { color: "success" },
};

export const PRIORITY_BADGE: Record<string, { color: string }> = {
  LOW: { color: "default" },
  MEDIUM: { color: "warning" },
  HIGH: { color: "danger" },
  URGENT: { color: "danger" },
};

export const STATUS_KEYS = Object.keys(STATUS_BADGE);
export const PRIORITY_KEYS = Object.keys(PRIORITY_BADGE);

/** Tono pastel (chip) por estado del ticket, prioridad y estado de la tarea. */
export const STATUS_TONE: Record<string, "warning" | "secondary" | "success"> = {
  OPEN: "warning",
  IN_PROGRESS: "secondary",
  CLOSED: "success",
};

export const PRIORITY_TONE: Record<string, "neutral" | "warning" | "alert" | "danger"> = {
  LOW: "neutral",
  MEDIUM: "warning",
  HIGH: "alert",
  URGENT: "danger",
};

export const ASSIGNMENT_TONE: Record<string, "neutral" | "secondary" | "info" | "success"> = {
  PENDING: "neutral",
  IN_PROGRESS: "secondary",
  IN_REVIEW: "info",
  COMPLETED: "success",
};

/** Tono del chip de "días en espera" (`WAIT_RATING_COLOR` usa los nombres del badge del kit). */
export const WAIT_RATING_TONE: Record<string, "success" | "info" | "warning" | "danger"> = {
  EXCELLENT: "success",
  GOOD: "info",
  REGULAR: "warning",
  POOR: "danger",
};
