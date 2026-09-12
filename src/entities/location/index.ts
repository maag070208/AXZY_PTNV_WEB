// API pública del slice "location". Nada fuera de esta carpeta debe importar
// directo desde model/ o api/ — todo pasa por este barrel.
export * from "./model/types";
export { locationsApi } from "./api/locationApi";
export { formatLocation } from "./model/format";