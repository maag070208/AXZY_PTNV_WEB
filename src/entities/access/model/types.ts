export type AccessEventType = "ENTRY" | "EXIT";

export type AccessLocationSource = "GPS" | "SITE_ONLY" | "MANUAL";

export type AccessMethod = "QR_SCAN" | "MANUAL";

export interface AccessGuardRef {
  id: string;
  name: string;
}

export interface AccessSiteRef {
  id: string;
  name: string;
}

/** Evento de acceso registrado al escanear una credencial (o alta manual). */
export interface AccessEvent {
  id: string;
  type: AccessEventType;
  /** Hora autoritativa del servidor. */
  occurredAt: string;
  /** Hora reportada por el dispositivo; solo auditoría. */
  deviceTimestamp: string | null;
  employeeId: string;
  employeeNameSnapshot: string | null;
  employeeNumberSnapshot: string | null;
  guardId: string | null;
  guard?: AccessGuardRef | null;
  siteId: string | null;
  site?: AccessSiteRef | null;
  latitude: number | null;
  longitude: number | null;
  gpsAccuracyMeters: number | null;
  locationSource: AccessLocationSource;
  method: AccessMethod;
  credentialVersion: number | null;
  scannedPayloadHash?: string | null;
  clientEventId: string | null;
  deviceId: string | null;
  deviceCode: string | null;
  notes: string | null;
  voidedAt: string | null;
  voidedById: string | null;
  voidReason: string | null;
  createdAt: string;
}

/** Sitio / portería del catálogo de control de acceso. */
export interface Site {
  id: string;
  name: string;
  code: string | null;
  active: boolean;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number | null;
  createdAt: string;
  updatedAt: string;
}
