export type UserRole = "ADMIN" | "GERENTE" | "JEFE_DE_AREA" | "EMPLEADO" | "RECURSOS_HUMANOS";

export interface AuthUser {
  id: string;
  username: string;
  email?: string | null;
  name: string;
  role: UserRole;
  departmentId?: string | null;
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