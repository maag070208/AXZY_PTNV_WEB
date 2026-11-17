/** Datos de las cartas de RH. Las fechas viajan como "YYYY-MM-DD". */

export type HrFormatKind = "laboral" | "apercibimiento";

export const RH_SIGNER_NAME = "Lic. Rosalba Meda Anaya";
export const RH_SIGNER_TITLE = "Jefatura de Recursos Humanos";

export interface LaboralLetterData {
  date: string;
  /** Línea opcional "A QUIEN CORRESPONDA"; vacío = solo "PRESENTE:". */
  addressee: string;
  /** "la C." o "el C." */
  treatment: "la" | "el";
  name: string;
  nss: string;
  curp: string;
  rfc: string;
  jobTitle: string;
  hireDate: string;
  /** Sueldo mensual neto (solo para la carta; no se guarda). */
  salary: number | null;
  signerName: string;
  signerTitle: string;
}

export interface ApercibimientoLetterData {
  date: string;
  name: string;
  jobTitle: string;
  irregularities: string;
  headName: string;
  signerName: string;
  signerTitle: string;
}

export const emptyLaboral = (date: string): LaboralLetterData => ({
  date,
  addressee: "",
  treatment: "la",
  name: "",
  nss: "",
  curp: "",
  rfc: "",
  jobTitle: "",
  hireDate: "",
  salary: null,
  signerName: RH_SIGNER_NAME,
  signerTitle: RH_SIGNER_TITLE,
});

export const emptyApercibimiento = (date: string): ApercibimientoLetterData => ({
  date,
  name: "",
  jobTitle: "",
  irregularities: "",
  headName: "",
  signerName: RH_SIGNER_NAME,
  signerTitle: RH_SIGNER_TITLE,
});
