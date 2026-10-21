export const PRIORITIES = [
  { value: "LOW", badgeColor: "gray" as const },
  { value: "MEDIUM", badgeColor: "warning" as const },
  { value: "HIGH", badgeColor: "danger" as const },
  { value: "URGENT", badgeColor: "danger" as const },
];

// Límite que acepta el API para el título del ticket.
export const MAX_TITLE_LENGTH = 150;

// Síntomas que el usuario elige con un toque. "other" cubre lo que no aparece
// y se completa con la nota final.
export const SYMPTOM_KEYS = [
  "noPower",
  "noConnection",
  "slow",
  "noResponse",
  "error",
  "stopped",
  "noise",
  "leak",
  "repair",
  "review",
  "other",
] as const;
