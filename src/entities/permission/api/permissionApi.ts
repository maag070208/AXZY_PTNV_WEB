import type { PermissionScope } from "@entities/user";
import { api } from "@shared/api/client";

/** Permiso del catálogo tal como lo expone la administración (incluye inactivos). */
export interface PermissionCatalog {
  key: string;
  module: string;
  name: string;
  description: string | null;
  scopes: PermissionScope[];
  sensitive: boolean;
  active: boolean;
  sortOrder: number;
}

/** Celda vigente de la matriz rol → permiso → alcance. */
export interface MatrixCell {
  role: string;
  permission: string;
  scope: PermissionScope;
}

/** Payload de `GET /permisos/admin`. */
export interface RolesAdminData {
  roles: string[];
  catalog: PermissionCatalog[];
  matrix: MatrixCell[];
}

/** Cambio de una celda de la matriz (`PUT /permisos/matriz`). */
export interface MatrixChange {
  role: string;
  permission: string;
  scope: PermissionScope;
}

/** Body de `POST /permisos/catalogo`. */
export interface CatalogCreateDto {
  key: string;
  module: string;
  name: string;
  description?: string;
  scopes: PermissionScope[];
  sensitive?: boolean;
  sortOrder?: number;
}

/** Body de `PATCH /permisos/catalogo/:clave`. */
export interface CatalogUpdateDto {
  module?: string;
  name?: string;
  description?: string | null;
  scopes?: PermissionScope[];
  sensitive?: boolean;
  active?: boolean;
  sortOrder?: number;
}

export const permissionApi = {
  /** Roles, catálogo completo y matriz (requiere `roles.administrar`). */
  getAdmin: () => api.get<RolesAdminData>("/permissions/admin"),
  /** Catálogo activo, para resolver nombres de permiso (cualquier sesión). */
  getCatalog: () => api.get<PermissionCatalog[]>("/permissions/catalog"),
  /** Aplica un lote de celdas de la matriz. */
  saveMatrix: (changes: MatrixChange[]) =>
    api.put<{ updated: number }>("/permissions/matrix", { changes }),
  /** Alta de un permiso del catálogo. */
  createCatalog: (dto: CatalogCreateDto) =>
    api.post<PermissionCatalog>("/permissions/catalog", dto),
  /** Edita metadatos, alcances, sensibilidad, orden o activo de un permiso. */
  updateCatalog: (key: string, dto: CatalogUpdateDto) =>
    api.patch<PermissionCatalog>(
      `/permissions/catalog/${encodeURIComponent(key)}`,
      dto
    ),
};
