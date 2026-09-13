import {
  DEVICE_FIELD_KEYS,
  type DeviceFieldConfig,
} from "@entities/device-type";

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