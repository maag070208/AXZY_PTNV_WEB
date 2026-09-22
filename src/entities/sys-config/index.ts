// API pública del slice "sys-config". Nada fuera de esta carpeta debe
// importar directo desde api/ — todo pasa por este barrel.
export { sysConfigApi, type SysConfig } from "./api/sysConfigApi";