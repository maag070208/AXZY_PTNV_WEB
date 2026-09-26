// API pública del slice "permiso". Nada fuera de esta carpeta debe importar
// directo desde api/ — todo pasa por este barrel.
export {
  permisoApi,
  type PermisoCatalogo,
  type MatrizCelda,
  type RolesAdminData,
  type MatrizCambio,
  type CatalogoCreateDto,
  type CatalogoUpdateDto,
} from "./api/permisoApi";
