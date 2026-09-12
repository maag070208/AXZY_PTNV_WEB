// API pública del slice "carta". Nada fuera de esta carpeta debe importar
// directo desde model/ o api/ — todo pasa por este barrel.
export * from "./model/types";
export * from "./model/carta.slice";
export * from "./api/cartaApi";