import {
  DEVICE_FIELD_KEYS,
  type DeviceFieldConfig,
  type DeviceFieldKey,
} from "@entities/device-type";

export const FIELD_LABELS: Record<DeviceFieldKey, string> = {
  numeroSerie: "Número de serie",
  nombreEquipo: "Nombre de equipo",
  ip: "Dirección IP",
  macAddress: "MAC Address",
  sistemaOp: "Sistema operativo",
  ram: "RAM",
  almacenamiento: "Almacenamiento",
};

export const emptyFieldConfig = (): DeviceFieldConfig =>
  DEVICE_FIELD_KEYS.reduce((config, key) => {
    config[key] = { enabled: false, required: false };
    return config;
  }, {} as DeviceFieldConfig);

export const normalizeFieldConfig = (
  config?: Partial<DeviceFieldConfig>
): DeviceFieldConfig =>
  DEVICE_FIELD_KEYS.reduce((result, key) => {
    const value = config?.[key];
    result[key] = {
      enabled: value?.enabled ?? false,
      required: Boolean(value?.enabled && value.required),
    };
    return result;
  }, emptyFieldConfig());