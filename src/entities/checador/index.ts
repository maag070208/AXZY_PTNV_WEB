// API pública del slice "checador" (reloj Hikvision). Nada fuera de esta
// carpeta debe importar directo desde model/ o api/ — todo pasa por este barrel.
export * from "./model/types";
export { checadorApi } from "./api/checadorApi";
