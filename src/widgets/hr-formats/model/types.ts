/** Datos de las cartas de RH. Las fechas viajan como "YYYY-MM-DD". */

export type HrFormatKind = "laboral" | "apercibimiento" | "daycare" | "purchaseRequest" | "quotationRequest";

export const RH_SIGNER_NAME = "Lic. Rosalba Meda Anaya";
export const RH_SIGNER_TITLE = "Jefatura de Recursos Humanos";

/** Datos patronales fijos que pide la constancia para guardería. */
export const EMPLOYER_REGISTRATION = "Y94-15081-109";
export const EMPLOYER_RFC = "HVP-1902142-A4";

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

/** Constancia para guardería (IMSS): horario, descanso y vacaciones de la persona. */
export interface DaycareLetterData {
  date: string;
  treatment: "la" | "el";
  name: string;
  rfc: string;
  nss: string;
  curp: string;
  jobTitle: string;
  hireDate: string;
  /** Texto libre, p. ej. "9:00 am. a 5:00 pm.". */
  schedule: string;
  /** Texto libre, p. ej. "lunes a domingo". */
  workDays: string;
  /** Texto libre, p. ej. "martes". */
  restDays: string;
  /** Periodo vacacional opcional: sin días o sin fechas no se imprime. */
  vacationDays: number | null;
  vacationFrom: string;
  vacationTo: string;
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

export const emptyDaycare = (date: string): DaycareLetterData => ({
  date,
  treatment: "la",
  name: "",
  rfc: "",
  nss: "",
  curp: "",
  jobTitle: "",
  hireDate: "",
  schedule: "",
  workDays: "",
  restDays: "",
  vacationDays: null,
  vacationFrom: "",
  vacationTo: "",
  signerName: RH_SIGNER_NAME,
  signerTitle: RH_SIGNER_TITLE,
});

/** Renglón de las tablas de productos/servicios (cantidad como texto libre). */
export interface RequestItem {
  product: string;
  description: string;
  quantity: string;
  unit: string;
}

export const emptyRequestItem = (): RequestItem => ({ product: "", description: "", quantity: "", unit: "" });

export type PurchaseExpenseType = "" | "operativo" | "capex" | "mantenimiento";

/** Solicitud de compra (formato en papel del hotel). Todo es opcional. */
export interface PurchaseRequestData {
  requestDate: string;
  priority: string;
  requestingArea: string;
  requiredDate: string;
  costCenter: string;
  availableBudget: string;
  expenseType: PurchaseExpenseType;
  items: RequestItem[];
  urgencyReason: string;
  justification: string;
  suggestedSupplier: string;
  requesterName: string;
}

/** Solicitud de cotización dirigida a un proveedor. Todo es opcional. */
export interface QuotationRequestData {
  requestDate: string;
  folio: string;
  requestingArea: string;
  requesterName: string;
  supplierName: string;
  supplierContact: string;
  supplierPhone: string;
  supplierEmail: string;
  responseDeadline: string;
  deliveryTerms: string;
  items: RequestItem[];
  notes: string;
}

export const emptyPurchaseRequest = (date: string): PurchaseRequestData => ({
  requestDate: date,
  priority: "",
  requestingArea: "",
  requiredDate: "",
  costCenter: "",
  availableBudget: "",
  expenseType: "",
  items: [emptyRequestItem()],
  urgencyReason: "",
  justification: "",
  suggestedSupplier: "",
  requesterName: "",
});

export const emptyQuotationRequest = (date: string): QuotationRequestData => ({
  requestDate: date,
  folio: "",
  requestingArea: "",
  requesterName: "",
  supplierName: "",
  supplierContact: "",
  supplierPhone: "",
  supplierEmail: "",
  responseDeadline: "",
  deliveryTerms: "",
  items: [emptyRequestItem()],
  notes: "",
});
