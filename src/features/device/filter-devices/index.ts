// API pública de la feature "filter-devices". Nada fuera de esta carpeta debe
// importar directo desde model/ o ui/ — todo pasa por este barrel.
export { useDeviceFilters } from "./model/useDeviceFilters";
export { default as DeviceFiltersBar } from "./ui/DeviceFiltersBar";