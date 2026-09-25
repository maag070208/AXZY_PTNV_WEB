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

/** Claves del catálogo de permisos del API (`api/src/core/permisos/catalogo.ts`). */
export type Permiso =
  | "tickets.ver"
  | "tickets.crear"
  | "tickets.editar"
  | "tickets.cerrar"
  | "tickets.eliminar"
  | "tareas.ver"
  | "tareas.asignar"
  | "tareas.completar"
  | "dispositivos.ver"
  | "dispositivos.crear"
  | "dispositivos.editar"
  | "dispositivos.eliminar"
  | "prestamos.ver"
  | "prestamos.crear"
  | "prestamos.editar"
  | "prestamos.eliminar"
  | "salidas.registrar"
  | "reportes.ver"
  | "reportes.exportar"
  | "personal.expediente"
  | "personal.actas"
  | "usuarios.ver"
  | "usuarios.crear"
  | "usuarios.editar"
  | "usuarios.eliminar"
  | "usuarios.permisos"
  | "departamentos.administrar"
  | "catalogos.administrar"
  | "acceso.escanear"
  | "acceso.bitacora"
  | "acceso.anular"
  | "acceso.sitios"
  | "checador.ver"
  | "checador.sincronizar"
  | "checador.vincular"
  | "relojes.administrar"
  | "horarios.ver"
  | "horarios.administrar"
  | "horas_extra.ver"
  | "horas_extra.aprobar"
  | "panel.ver"
  | "auditoria.ver"
  | "sistema.configurar";

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