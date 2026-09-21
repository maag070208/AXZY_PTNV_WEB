// API pública del slice "ticket". Nada fuera de esta carpeta debe importar
// directo desde model/ o api/ — todo pasa por este barrel.
export * from "./model/types";
export * from "./model/labels";
export * from "./model/espera";
export * from "./model/ticket.slice";
export { default } from "./model/ticket.slice";
export { ticketsApi } from "./api/ticketApi";