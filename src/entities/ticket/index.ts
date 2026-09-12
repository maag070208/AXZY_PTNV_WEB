// API pública del slice "ticket". Nada fuera de esta carpeta debe importar
// directo desde model/ o api/ — todo pasa por este barrel.
export * from "./model/types";
export { ticketsApi } from "./api/ticketApi";