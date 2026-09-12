// API pública del slice "device-type". Nada fuera de esta carpeta debe
// importar directo desde model/ o api/ — todo pasa por este barrel.
export * from "./model/types";
export { deviceTypeApi } from "./api/deviceTypeApi";
export { useDeviceTypes } from "./model/useDeviceTypes";
