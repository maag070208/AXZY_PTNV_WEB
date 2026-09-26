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