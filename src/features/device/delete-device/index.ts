// API pública de la feature "delete-device". Nada fuera de esta carpeta debe
// importar directo desde model/ o ui/ — todo pasa por este barrel.
export { useDeleteDevice } from "./model/useDeleteDevice";
export { default as DeleteDeviceDialog } from "./ui/DeleteDeviceDialog";