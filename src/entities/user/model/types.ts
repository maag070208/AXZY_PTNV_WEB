export type UserRole = "ADMIN" | "GERENTE" | "JEFE_DE_AREA" | "EMPLEADO" | "RECURSOS_HUMANOS";

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
  permisos?: Partial<Record<Permiso, Alcance>>;
}

/** Alcance efectivo de un permiso (ver ROLES_Y_PERMISOS.md §2). */
export type Alcance = "NINGUNO" | "PROPIO" | "AREA" | "TODO";

/**
 * Clave del catálogo dinámico de permisos del API (`GET /permisos/catalogo`).
 * Antes era un union hardcodeado; ahora el catálogo vive en la BD y puede
 * crecer sin recompilar la web, así que la clave se tipa como string libre.
 */
export type Permiso = string;

/** `GET /auth/me`: el usuario de la sesión con los datos de su credencial. */
export interface AuthMe extends AuthUser {
  numeroEmpleado: string | null;
  puesto: string | null;
  department: { id: string; name: string } | null;
  fotoUrl: string | null;
  permisos: Partial<Record<Permiso, Alcance>>;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface User extends AuthUser {
  active: boolean;
  segundoNombre?: string | null;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  puesto?: string;
  area?: string;
  numeroEmpleado?: string;
  empresa?: string | null;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  subareaId?: string | null;
  subarea?: { id: string; name: string } | null;
}