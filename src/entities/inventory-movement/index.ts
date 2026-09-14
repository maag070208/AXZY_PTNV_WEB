// API pública del slice "inventory-movement". Nada fuera de esta carpeta debe
// importar directo desde model/ o api/ — todo pasa por este barrel.
export * from "./model/types";
export * from "./model/constants";
export { inventoryApi } from "./api/inventoryMovementApi";