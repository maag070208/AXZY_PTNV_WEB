// API pública del widget "carta-pdf". Nada fuera de esta carpeta debe importar
// directo desde model/ o ui/ — todo pasa por este barrel.
export { default as CartaPDF } from "./ui/CartaPDF";
export { downloadCartaPDF } from "./model/pdf";