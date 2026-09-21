export type TipoDescuento = "INFONAVIT" | "IMSS" | "DEUDOR_ALIMENTICIO";

export interface Genero {
  id: string;
  nombre: string;
  activo: boolean;
}

export type PersonalRole = "GERENTE" | "JEFE_DE_AREA" | "EMPLEADO";

export interface PersonalStats {
  total: number;
  activos: number;
  inactivos: number;
  roles: Record<PersonalRole, number>;
}

export interface TipoSangre {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface TipoDocumento {
  id: string;
  nombre: string;
  activo: boolean;
  orden: number;
  createdAt: string;
}

export interface EmployeeDiscount {
  tipo: TipoDescuento;
  nota?: string | null;
}

export interface EmployeeDocument {
  id: string;
  tipoDocumentoId: string;
  tipoDocumento: { id: string; nombre: string };
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
  role: "ADMIN" | "GERENTE" | "JEFE_DE_AREA" | "EMPLEADO" | "RECURSOS_HUMANOS";
  active: boolean;
  puesto?: string | null;
  numeroEmpleado?: string | null;
  empresa?: string | null;
  department?: { id: string; name: string } | null;
  subarea?: { id: string; name: string } | null;

  segundoNombre?: string | null;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  fotoUrl?: string | null;

  genero?: Genero | null;
  tipoSangre?: TipoSangre | null;
  padecimiento?: string | null;
  alergias?: string | null;

  fechaNacimiento?: string | null;
  fechaIngreso?: string | null;

  rfc?: string | null;
  curp?: string | null;
  nss?: string | null;

  calleNumero?: string | null;
  colonia?: string | null;
  codigoPostal?: string | null;
  ciudad?: string | null;
  estadoDireccion?: string | null;
  pais?: string | null;

  celularPersonal?: string | null;
  celularEmpresa?: string | null;

  contactoEmergenciaNombre?: string | null;
  contactoEmergenciaTelefono?: string | null;
  contactoEmergenciaParentesco?: string | null;

  discounts: EmployeeDiscount[];

  createdAt: string;
}

export interface PersonalProfileUpdateInput {
  segundoNombre?: string | null;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  email?: string | null;

  generoId?: string | null;
  tipoSangreId?: string | null;
  padecimiento?: string | null;
  alergias?: string | null;

  fechaNacimiento?: string | null;
  fechaIngreso?: string | null;

  rfc?: string | null;
  curp?: string | null;
  nss?: string | null;

  calleNumero?: string | null;
  colonia?: string | null;
  codigoPostal?: string | null;
  ciudad?: string | null;
  estadoDireccion?: string | null;
  pais?: string | null;

  celularPersonal?: string | null;
  celularEmpresa?: string | null;

  contactoEmergenciaNombre?: string | null;
  contactoEmergenciaTelefono?: string | null;
  contactoEmergenciaParentesco?: string | null;
}

export type MotivoActaAdministrativa =
  | "INASISTENCIA"
  | "RETARDO"
  | "EBRIEDAD"
  | "CONDUCTA"
  | "INCUMPLIMIENTO"
  | "OTRO";

export interface ActaAdministrativa {
  id: string;
  motivo: MotivoActaAdministrativa;
  fechaIncidente: string;
  descripcion: string;
  sancion?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    numeroEmpleado?: string | null;
    puesto?: string | null;
    department?: { id: string; name: string } | null;
    subarea?: { id: string; name: string } | null;
  };
  createdBy: { id: string; name: string };
}

export interface ActaAdministrativaCreateInput {
  userId: string;
  motivo: MotivoActaAdministrativa;
  fechaIncidente: string;
  descripcion: string;
  sancion?: string;
}
