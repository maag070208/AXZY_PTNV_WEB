// API pública del slice "device". Nada fuera de esta carpeta debe importar
// directo desde model/ / api/ / ui/ — todo pasa por este barrel.
export * from "./model/types";
export type { Location } from "@entities/location";
export { deviceApi } from "./api/deviceApi";
export { useDeviceSummary } from "./model/useDeviceSummary";
export { default as DeviceCard } from "./ui/DeviceCard";
export { default as DeviceStatusBadge } from "./ui/DeviceStatusBadge";
