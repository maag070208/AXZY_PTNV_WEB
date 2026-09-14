export interface Subarea {
  id: string;
  departmentId: string;
  name: string;
  active: boolean;
}

// Una Location pertenece a lo más a un Department (no se comparten), por eso
// es la Location completa, no un registro de tabla puente.
export interface DepartmentLocation {
  id: string;
  lugar: string;
  descripcion?: string | null;
  active: boolean;
}

export interface DepartmentPersonRef {
  id: string;
  name: string;
}

export interface DepartmentTicket {
  id: string;
  titulo: string;
  status: "ABIERTO" | "EN_SEGUIMIENTO" | "CERRADO";
  priority: "BAJA" | "MEDIA" | "ALTA" | "URGENTE";
  category: string;
  creadoEn: string;
  asignadoA?: DepartmentPersonRef | null;
}

export interface DepartmentCarta {
  id: string;
  consecutive: string;
  fecha: string;
  returnDate?: string | null;
  responsable?: DepartmentPersonRef | null;
  encargado?: DepartmentPersonRef | null;
  itemsCount: number;
}

export interface Department {
  id: string;
  name: string;
  active: boolean;
  subareas: Subarea[];
  locations?: DepartmentLocation[];
  tickets?: DepartmentTicket[];
  ticketsTotal?: number;
  cartas?: DepartmentCarta[];
  cartasTotal?: number;
  _count?: { users: number };
}
