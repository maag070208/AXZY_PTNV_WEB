export type DiscountType = "INFONAVIT" | "IMSS" | "CHILD_SUPPORT";

export interface Gender {
  id: string;
  name: string;
  active: boolean;
}

export type PersonalRole = "MANAGER" | "AREA_HEAD" | "EMPLOYEE";

export interface PersonalStats {
  total: number;
  active: number;
  inactive: number;
  roles: Record<PersonalRole, number>;
}

export interface BloodType {
  id: string;
  name: string;
  active: boolean;
}

export interface DocumentType {
  id: string;
  name: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface EmployeeDiscount {
  type: DiscountType;
  note?: string | null;
}

export interface EmployeeDocument {
  id: string;
  documentTypeId: string;
  documentType: { id: string; name: string };
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  uploadedById: string;
  createdAt: string;
}

export interface PersonalProfile {
  id: string;
  username: string;
  name: string;
  email?: string | null;
  role: "ADMIN" | "MANAGER" | "AREA_HEAD" | "EMPLOYEE" | "HUMAN_RESOURCES";
  active: boolean;
  jobTitle?: string | null;
  employeeNumber?: string | null;
  company?: string | null;
  department?: { id: string; name: string } | null;
  subarea?: { id: string; name: string } | null;

  middleName?: string | null;
  paternalSurname?: string | null;
  maternalSurname?: string | null;
  photoUrl?: string | null;

  gender?: Gender | null;
  bloodType?: BloodType | null;
  medicalConditions?: string | null;
  allergies?: string | null;

  birthDate?: string | null;
  hireDate?: string | null;

  rfc?: string | null;
  curp?: string | null;
  nss?: string | null;

  streetAddress?: string | null;
  neighborhood?: string | null;
  postalCode?: string | null;
  city?: string | null;
  addressState?: string | null;
  country?: string | null;

  personalPhone?: string | null;
  workPhone?: string | null;

  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;

  discounts: EmployeeDiscount[];

  createdAt: string;
}

export interface PersonalProfileUpdateInput {
  middleName?: string | null;
  paternalSurname?: string | null;
  maternalSurname?: string | null;
  email?: string | null;

  genderId?: string | null;
  bloodTypeId?: string | null;
  medicalConditions?: string | null;
  allergies?: string | null;

  birthDate?: string | null;
  hireDate?: string | null;

  rfc?: string | null;
  curp?: string | null;
  nss?: string | null;

  streetAddress?: string | null;
  neighborhood?: string | null;
  postalCode?: string | null;
  city?: string | null;
  addressState?: string | null;
  country?: string | null;

  personalPhone?: string | null;
  workPhone?: string | null;

  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
}

export type DisciplinaryReason =
  | "ABSENCE"
  | "TARDINESS"
  | "INTOXICATION"
  | "MISCONDUCT"
  | "NONCOMPLIANCE"
  | "OTHER";

export interface DisciplinaryReport {
  id: string;
  reason: DisciplinaryReason;
  incidentDate: string;
  description: string;
  sanction?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    employeeNumber?: string | null;
    jobTitle?: string | null;
    department?: { id: string; name: string } | null;
    subarea?: { id: string; name: string } | null;
  };
  createdBy: { id: string; name: string };
}

export interface DisciplinaryReportCreateInput {
  userId: string;
  reason: DisciplinaryReason;
  incidentDate: string;
  description: string;
  sanction?: string;
}
