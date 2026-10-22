/** Personas y tarjetas del reloj. Las altas, cambios y bajas ESCRIBEN en el reloj. */

export interface TimeClockPerson {
  employeeNumber: string;
  name: string;
  cards: string[];
}

export interface TimeClockPeopleList {
  people: TimeClockPerson[];
  cards: Array<{ cardNo: string; employeeNumber: string; cardType: string | null }>;
}

/** Huellas de una persona en un reloj. */
export interface FingerprintStatus {
  employeeNumber: string;
  /** Posiciones de dedo ya registradas en el reloj (1 a 10). */
  fingerIds: number[];
  fingerprints: number;
  max: number;
}

/** Huella capturada con el sensor del reloj. La plantilla nunca viaja al navegador. */
export interface FingerprintCapture {
  captureId: string;
  fingerNo: number;
  quality: number;
  minQuality: number;
  acceptable: boolean;
}

/** Conteos de rostros y huellas por número de persona (solo lectura, con caché en la API). */
export interface TimeClockBiometrics {
  updatedAt: string;
  people: Record<string, { faces: number; fingerprints: number }>;
}

/** Estado del alta de una persona del sistema en cada reloj registrado. Solo lectura. */
export interface EmployeeClockStatus {
  employeeNumber: string | null;
  clocks: Array<{
    serial: string;
    name: string;
    connection: "ONLINE" | "NO_RESPONSE";
    state: "SIN_ALTA" | "DADA_DE_ALTA" | null;
    /** El reloj acepta altas desde la web (hoy, solo el de prueba). */
    canAlta: boolean;
  }>;
}

export type ClockGender = "male" | "female" | "unknown";

export interface TimeClockPersonInput {
  employeeNumber: string;
  name: string;
  gender: ClockGender;
}
