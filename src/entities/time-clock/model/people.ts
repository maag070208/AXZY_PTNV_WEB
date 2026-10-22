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
