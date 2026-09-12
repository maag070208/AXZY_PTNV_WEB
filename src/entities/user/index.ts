// API pública del slice "user". Nada fuera de esta carpeta debe importar
// directo desde model/ o api/ — todo pasa por este barrel.
export * from "./model/types";
export { authApi } from "./api/userApi";
export { usersApi } from "./api/userApi";