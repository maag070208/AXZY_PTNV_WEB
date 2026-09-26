// API pública del slice "checador" (relojes Hikvision). Nada fuera de esta
// carpeta debe importar directo desde model/ o api/ — todo pasa por este barrel.
export * from "./model/types";
export * from "./model/estado";
export { checadorApi } from "./api/checadorApi";
