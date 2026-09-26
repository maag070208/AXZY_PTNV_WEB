export type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "AREA_HEAD"
  | "EMPLOYEE"
  | "HUMAN_RESOURCES"
  | "GUARD";

/** Etiqueta visible de cada rol. El guardia se guarda como `GUARD`. */
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  AREA_HEAD: "JEFE DE AREA",
  EMPLOYEE: "EMPLOYEE",
  HUMAN_RESOURCES: "RECURSOS HUMANOS",
  GUARD: "GUARDIA",
};

export interface AuthUser {
  id: string;
  username: string;
  email?: string | null;
  name: string;
  role: UserRole;
  departmentId?: string | null;
  /**
   * Permisos efectivos del usuario (`GET /auth/me`): clave → alcance, solo los
   * distintos de NINGUNO. Opcional porque las sesiones persistidas antes del
   * rollout de permisos no lo traen y `PrivateRoutes` las rehidrata.
   */
  permissions?: Partial<Record<Permission, PermissionScope>>;
}

/** Alcance efectivo de un permiso (ver ROLES_Y_PERMISOS.md §2). */
export type PermissionScope = "NONE" | "OWN" | "AREA" | "ALL";

/**
 * Clave del catálogo dinámico de permisos del API (`GET /permisos/catalogo`).
 * Antes era un union hardcodeado; ahora el catálogo vive en la BD y puede
 * crecer sin recompilar la web, así que la clave se tipa como string libre.
 */
export type Permission = string;

/** `GET /auth/me`: el usuario de la sesión con los datos de su credencial. */
export interface AuthMe extends AuthUser {
  employeeNumber: string | null;
  jobTitle: string | null;
  department: { id: string; name: string } | null;
  photoUrl: string | null;
  permissions: Partial<Record<Permission, PermissionScope>>;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface User extends AuthUser {
  active: boolean;
  middleName?: string | null;
  paternalSurname?: string | null;
  maternalSurname?: string | null;
  jobTitle?: string;
  area?: string;
  employeeNumber?: string;
  company?: string | null;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  subareaId?: string | null;
  subarea?: { id: string; name: string } | null;
}