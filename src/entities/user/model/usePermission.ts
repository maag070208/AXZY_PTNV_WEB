import { useSelector } from "react-redux";
import type { Alcance, Permiso } from "./types";

/**
 * Forma mínima del estado que necesita el hook. Se declara aquí en vez de
 * importar `RootState` de `@app/store` porque los `entities` no pueden depender
 * de `app` (regla FSD en `eslint.config.js`).
 */
interface AuthStateLike {
  auth: { user: { permisos?: Partial<Record<Permiso, Alcance>> } | null };
}

/** Alcance efectivo del permiso para la sesión actual (NINGUNO si no aplica). */
export const usePermiso = (permiso: Permiso): Alcance =>
  useSelector(
    (state: AuthStateLike) => state.auth.user?.permisos?.[permiso] ?? "NINGUNO"
  );

/** ¿La sesión actual tiene el permiso con cualquier alcance? */
export const usePuede = (permiso: Permiso): boolean => usePermiso(permiso) !== "NINGUNO";

/** Helper puro para decidir sobre un mapa de permisos ya cargado. */
export const puede = (
  permisos: Partial<Record<Permiso, Alcance>> | undefined,
  permiso: Permiso
): boolean => (permisos?.[permiso] ?? "NINGUNO") !== "NINGUNO";
