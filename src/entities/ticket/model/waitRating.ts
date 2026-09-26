export type WaitRating = "EXCELLENT" | "GOOD" | "REGULAR" | "POOR";

export const WAIT_RATING_COLOR: Record<WaitRating, string> = {
  EXCELLENT: "success",
  GOOD: "info",
  REGULAR: "warning",
  POOR: "danger",
};

const DAY_MS = 86_400_000;

export const daysOnHold = (createdAt: string, closedAt?: string | null): number => {
  const from = new Date(createdAt).getTime();
  const to = closedAt ? new Date(closedAt).getTime() : Date.now();
  return Math.max(1, Math.floor((to - from) / DAY_MS));
};

export const waitRating = (days: number): WaitRating => {
  if (days > 12) return "POOR";
  if (days > 7) return "REGULAR";
  if (days > 3) return "GOOD";
  return "EXCELLENT";
};