import type { ReactNode } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import type { RootState } from "@app/store";
import type { UserRole } from "@entities/user";

interface Props {
  /** Roles que pueden ver la ruta. Cualquier otro rol es redirigido a inicio. */
  roles: UserRole[];
  children: ReactNode;
}

/**
 * Gate de rol a nivel de ruta. `PrivateRoutes` ya garantiza que hay sesión;
 * aquí se bloquea el acceso directo por URL a secciones no autorizadas (la
 * barra lateral ocultarlas no basta). Mientras el usuario aún no cargue
 * (`meThunk` en vuelo) no se decide nada para no redirigir en falso.
 */
export default function RoleGuard({ roles, children }: Props) {
  const user = useSelector((s: RootState) => s.auth.user);

  if (!user) return null;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
