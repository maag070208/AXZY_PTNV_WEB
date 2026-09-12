export const DEVICE_FIELD_KEYS = [
  "numeroSerie",
  "nombreEquipo",
  "ip",
  "macAddress",
  "sistemaOp",
  "ram",
  "almacenamiento",
] as const;

export type DeviceFieldKey = (typeof DEVICE_FIELD_KEYS)[number];

export interface DeviceFieldSetting {
  enabled: boolean;
  required: boolean;
}

export type DeviceFieldConfig = Record<DeviceFieldKey, DeviceFieldSetting>;

export interface DeviceType {
  id: string;
  code: string;
  name: string;
  prefix: string;
  contador: number;
  active: boolean;
  fieldConfig: DeviceFieldConfig;
  _count?: { devices: number };
}
