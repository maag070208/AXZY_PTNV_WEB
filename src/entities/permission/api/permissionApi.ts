import type { Alcance } from "@entities/user";
import { api } from "@shared/api/client";

/** Permiso del catálogo tal como lo expone la administración (incluye inactivos). */
export interface PermisoCatalogo {
  clave: string;
  modulo: string;
  nombre: string;
  descripcion: string | null;
  alcances: Alcance[];
  sensible: boolean;
  activo: boolean;
  orden: number;
}

/** Celda vigente de la matriz rol → permiso → alcance. */
export interface MatrizCelda {
  rol: string;
  permiso: string;
  alcance: Alcance;
}

/** Payload de `GET /permisos/admin`. */
export interface RolesAdminData {
  roles: string[];
  catalogo: PermisoCatalogo[];
  matriz: MatrizCelda[];
}

/** Cambio de una celda de la matriz (`PUT /permisos/matriz`). */
export interface MatrizCambio {
  rol: string;
  permiso: string;
  alcance: Alcance;
}

/** Body de `POST /permisos/catalogo`. */
export interface CatalogoCreateDto {
  clave: string;
  modulo: string;
  nombre: string;
  descripcion?: string;
  alcances: Alcance[];
  sensible?: boolean;
  orden?: number;
}

/** Body de `PATCH /permisos/catalogo/:clave`. */
export interface CatalogoUpdateDto {
  modulo?: string;
  nombre?: string;
  descripcion?: string | null;
  alcances?: Alcance[];
  sensible?: boolean;
  activo?: boolean;
  orden?: number;
}

export const permisoApi = {
  /** Roles, catálogo completo y matriz (requiere `roles.administrar`). */
  getAdmin: () => api.get<RolesAdminData>("/permisos/admin"),
  /** Catálogo activo, para resolver nombres de permiso (cualquier sesión). */
  getCatalogo: () => api.get<PermisoCatalogo[]>("/permisos/catalogo"),
  /** Aplica un lote de celdas de la matriz. */
  saveMatriz: (cambios: MatrizCambio[]) =>
    api.put<{ updated: number }>("/permisos/matriz", { cambios }),
  /** Alta de un permiso del catálogo. */
  createCatalogo: (dto: CatalogoCreateDto) =>
    api.post<PermisoCatalogo>("/permisos/catalogo", dto),
  /** Edita metadatos, alcances, sensibilidad, orden o activo de un permiso. */
  updateCatalogo: (clave: string, dto: CatalogoUpdateDto) =>
    api.patch<PermisoCatalogo>(
      `/permisos/catalogo/${encodeURIComponent(clave)}`,
      dto
    ),
};
