import type { Location } from "./types";

export const formatLocation = (loc?: Location | null): string => {
  if (!loc) return "Sin ubicación";
  const parts = [loc.lugar, loc.subLugar, loc.numero].filter(Boolean);
  return parts.length > 0 ? parts.join("-") : "Ubicación sin nombre";
};