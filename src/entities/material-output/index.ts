// API pública del slice "salida". Nada fuera de esta carpeta debe importar
// directo desde model/ o api/ — todo pasa por este barrel.
export * from "./model/types";
export { salidasApi } from "./api/salidaApi";