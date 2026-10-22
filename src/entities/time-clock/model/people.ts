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

export type ClockGender = "male" | "female" | "unknown";

export interface TimeClockPersonInput {
  employeeNumber: string;
  name: string;
  gender: ClockGender;
}
