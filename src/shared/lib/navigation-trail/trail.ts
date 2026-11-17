/** Lógica pura del rastro de navegación (sin React): fácil de razonar y probar. */

export interface TrailEntry {
  /** pathname + search */
  key: string;
  label: string;
}

export const MAX_TRAIL = 8;
const STORAGE_KEY = "nav-trail";

export type TrailAction =
  | { type: "POP"; key: string; pathname: string }
  | { type: "PUSH"; key: string; pathname: string; root: boolean }
  | { type: "REPLACE"; key: string; pathname: string }
  | { type: "LABEL"; key: string; label: string }
  | { type: "CLEAR" };

const pathOf = (key: string) => key.split("?")[0];

/** Etiqueta de respaldo legible a partir de la ruta (último segmento). */
export const fallbackLabel = (key: string): string => {
  const path = pathOf(key);
  if (path === "/") return "/";
  const last = path.split("/").filter(Boolean).pop() ?? "";
  const text = decodeURIComponent(last).replace(/[-_]+/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const fresh = (key: string): TrailEntry[] => [{ key, label: fallbackLabel(key) }];
const cap = (list: TrailEntry[]) => list.slice(-MAX_TRAIL);

export function trailReducer(state: TrailEntry[], action: TrailAction): TrailEntry[] {
  switch (action.type) {
    case "CLEAR":
      return [];
    case "LABEL": {
      const i = state.findIndex((e) => e.key === action.key);
      if (i < 0 || state[i].label === action.label) return state;
      return state.map((e, idx) => (idx === i ? { ...e, label: action.label } : e));
    }
    case "POP": {
      const i = state.findIndex((e) => e.key === action.key);
      return i >= 0 ? state.slice(0, i + 1) : fresh(action.key);
    }
    case "REPLACE": {
      if (state.length === 0) return fresh(action.key);
      const last = state[state.length - 1];
      if (last.key === action.key) return state;
      return [...state.slice(0, -1), { ...last, key: action.key }];
    }
    case "PUSH": {
      if (action.root || state.length === 0) return fresh(action.key);
      const i = state.findIndex((e) => e.key === action.key);
      if (i >= 0) return state.slice(0, i + 1);
      const last = state[state.length - 1];
      // Misma ruta con otro search: es la misma pantalla, se reemplaza.
      if (pathOf(last.key) === action.pathname) return [...state.slice(0, -1), { ...last, key: action.key }];
      return cap([...state, { key: action.key, label: fallbackLabel(action.key) }]);
    }
  }
}

export const loadTrail = (): TrailEntry[] => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e): e is TrailEntry => !!e && typeof e.key === "string" && typeof e.label === "string")
      .slice(-MAX_TRAIL);
  } catch {
    return [];
  }
};

export const saveTrail = (trail: TrailEntry[]): void => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trail));
  } catch {
    /* sin sessionStorage: el rastro vive solo en memoria */
  }
};
