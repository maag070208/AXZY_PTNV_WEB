// API pública del slice "permiso". Nada fuera de esta carpeta debe importar
// directo desde api/ — todo pasa por este barrel.
export {
  permissionApi,
  type PermissionCatalog,
  type MatrixCell,
  type RolesAdminData,
  type MatrixChange,
  type CatalogCreateDto,
  type CatalogUpdateDto,
} from "./api/permissionApi";
