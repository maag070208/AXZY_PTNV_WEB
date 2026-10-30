import type { KanbanAssignment } from "@entities/ticket";

/** Grupos de la lista de "Mis tareas", en el orden en que se muestran. */
export type DueGroup = "overdue" | "today" | "week" | "later" | "noDate";

export const DUE_GROUPS: readonly DueGroup[] = ["overdue", "today", "week", "later", "noDate"];

const DAY_MS = 86_400_000;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** En qué grupo cae una tarea según su fecha límite (las completadas nunca están vencidas). */
export const dueGroupOf = (a: KanbanAssignment, now = new Date()): DueGroup => {
  if (!a.dueDate) return "noDate";
  const today = startOfDay(now);
  const due = startOfDay(new Date(a.dueDate));
  if (due < today && a.status !== "COMPLETED") return "overdue";
  if (due <= today) return "today";
  if (due < today + 7 * DAY_MS) return "week";
  return "later";
};

/** Reparte las tareas por grupo, cada grupo ordenado por fecha límite. */
export const groupByDue = (rows: readonly KanbanAssignment[]): Record<DueGroup, KanbanAssignment[]> => {
  const out: Record<DueGroup, KanbanAssignment[]> = { overdue: [], today: [], week: [], later: [], noDate: [] };
  const byDue = (a: KanbanAssignment, b: KanbanAssignment) =>
    new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime();
  for (const a of rows) out[dueGroupOf(a)].push(a);
  for (const g of DUE_GROUPS) out[g].sort(byDue);
  return out;
};
