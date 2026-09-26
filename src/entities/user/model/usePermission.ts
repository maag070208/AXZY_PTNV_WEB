import { useSelector } from "react-redux";
import type { PermissionScope, Permission } from "./types";

/**
 * Forma mínima del estado que necesita el hook. Se declara aquí en vez de
 * importar `RootState` de `@app/store` porque los `entities` no pueden depender
 * de `app` (regla FSD en `eslint.config.js`).
 */
interface AuthStateLike {
  auth: { user: { permissions?: Partial<Record<Permission, PermissionScope>> } | null };
}

/** Alcance efectivo del permiso para la sesión actual (NINGUNO si no aplica). */
export const usePermission = (permission: Permission): PermissionScope =>
  useSelector(
    (state: AuthStateLike) => state.auth.user?.permissions?.[permission] ?? "NONE"
  );

/** ¿La sesión actual tiene el permiso con cualquier alcance? */
export const useCan = (permission: Permission): boolean => usePermission(permission) !== "NONE";

/** Helper puro para decidir sobre un mapa de permisos ya cargado. */
export const can = (
  permissions: Partial<Record<Permission, PermissionScope>> | undefined,
  permission: Permission
): boolean => (permissions?.[permission] ?? "NONE") !== "NONE";
