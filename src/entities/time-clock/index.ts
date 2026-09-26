// API pública del slice "checador" (relojes Hikvision). Nada fuera de esta
// carpeta debe importar directo desde model/ o api/ — todo pasa por este barrel.
export * from "./model/types";
export * from "./model/status";
export { timeClockApi } from "./api/timeClockApi";
