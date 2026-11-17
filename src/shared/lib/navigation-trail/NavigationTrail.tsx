import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { loadTrail, saveTrail, trailReducer, type TrailAction, type TrailEntry } from "./trail";

interface TrailContextValue {
  trail: TrailEntry[];
  dispatch: (action: TrailAction) => void;
}

const TrailContext = createContext<TrailContextValue>({ trail: [], dispatch: () => undefined });

/** Provee el rastro; debe montarse dentro del router. */
export function NavigationTrailProvider({ children }: { children: ReactNode }) {
  const [trail, dispatch] = useReducer(trailReducer, undefined, loadTrail);
  useEffect(() => saveTrail(trail), [trail]);
  const value = useMemo(() => ({ trail, dispatch }), [trail]);
  return <TrailContext.Provider value={value}>{children}</TrailContext.Provider>;
}

export const useNavigationTrail = () => useContext(TrailContext);

/** Reacciona a cada navegación y mantiene el rastro. Se monta una sola vez. */
export function NavigationTrailTracker() {
  const location = useLocation();
  const type = useNavigationType();
  const { dispatch } = useNavigationTrail();
  const key = location.pathname + location.search;
  const root = (location.state as { navRoot?: boolean } | null)?.navRoot === true;

  // Layout effect: el rastro ya está al día cuando la página nueva se pinta.
  useLayoutEffect(() => {
    const pathname = location.pathname;
    if (type === "POP") dispatch({ type: "POP", key, pathname });
    else if (type === "REPLACE") dispatch({ type: "REPLACE", key, pathname });
    else dispatch({ type: "PUSH", key, pathname, root });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  return null;
}

/** La página registra su etiqueta para la llave actual. */
export function useRegisterTrailLabel(label: string | undefined) {
  const location = useLocation();
  const { dispatch } = useNavigationTrail();
  const key = location.pathname + location.search;
  useEffect(() => {
    if (label) dispatch({ type: "LABEL", key, label });
  }, [dispatch, key, label]);
}
