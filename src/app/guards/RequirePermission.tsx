import type { ReactNode } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import type { RootState } from "@app/store";
import { usePermiso, type Permiso } from "@entities/user";

interface Props {
  /** Permiso que debe tener la sesión (con cualquier alcance). */
  permiso: Permiso;
  children: ReactNode;
}

/**
 * Gate de permiso a nivel de ruta. `PrivateRoutes` ya garantiza que hay sesión;
 * aquí se bloquea el acceso directo por URL a secciones no autorizadas. Mientras
 * el usuario no cargue (`meThunk` en vuelo) no se decide nada para no redirigir
 * en falso.
 */
export default function RequierePermiso({ permiso, children }: Props) {
  const user = useSelector((s: RootState) => s.auth.user);
  const alcance = usePermiso(permiso);

  if (!user) return null;
  if (alcance === "NINGUNO") return <Navigate to="/" replace />;

  return <>{children}</>;
}
