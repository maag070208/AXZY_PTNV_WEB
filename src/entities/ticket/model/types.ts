export interface TicketComment {
  id: string;
  ticketId: string;
  autorId: string;
  autor: { id: string; name: string; username: string };
  texto: string;
  creadoEn: string;
}

export interface TicketHistoryEntry {
  id: string;
  ticketId: string;
  type: string;
  detail?: string | null;
  autor?: { id: string; name: string; username: string } | null;
  createdAt: string;
}

export interface TicketAssignmentComment {
  id: string;
  assignmentId: string;
  autorId: string;
  autor: { id: string; name: string; username: string };
  texto: string;
  createdAt: string;
}

export type AssignmentStatus = "PENDIENTE" | "EN_PROGRESO" | "EN_REVISION" | "COMPLETADA";

export interface TicketAssignment {
  id: string;
  ticketId: string;
  userId: string;
  user: { id: string; name: string; username: string; numeroEmpleado?: string | null; puesto?: string | null };
  title: string;
  description: string;
  startDate?: string | null;
  dueDate?: string | null;
  status: AssignmentStatus;
  comments: TicketAssignmentComment[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketAttachment {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  kind: string;
  createdAt: string;
  uploadedById: string;
  assignmentId?: string | null;
  url: string;
}

export interface Ticket {
  id: string;
  titulo: string;
  descripcion: string;
  status: "ABIERTO" | "EN_SEGUIMIENTO" | "CERRADO";
  priority: "BAJA" | "MEDIA" | "ALTA" | "URGENTE";
  category: "MANTENIMIENTO" | "EQUIPO" | "SISTEMA" | "OTRO";
  creadoPorId: string;
  creadoPor: { id: string; name: string; username: string; puesto?: string };
  asignadoAId?: string | null;
  asignadoA?: { id: string; name: string; username: string; puesto?: string } | null;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  closedAt?: string | null;
  closedBy?: string | null;
  deletedAt?: string | null;
  assignments: TicketAssignment[];
  attachments?: TicketAttachment[];
  comments: TicketComment[];
  history: TicketHistoryEntry[];
  creadoEn: string;
  actualizadoEn: string;
}

export interface TicketInput {
  titulo: string;
  descripcion: string;
  priority?: string;
  category?: string;
  departmentId?: string;
  asignadoAId?: string;
}

export interface KanbanAssignment {
  id: string;
  ticketId: string;
  userId: string;
  user: { id: string; name: string; username: string; numeroEmpleado?: string | null; puesto?: string | null };
  title: string;
  description: string;
  startDate?: string | null;
  dueDate?: string | null;
  status: AssignmentStatus;
  createdAt: string;
  comments?: TicketAssignmentComment[];
  ticket: {
    id: string;
    titulo: string;
    status: "ABIERTO" | "EN_SEGUIMIENTO" | "CERRADO";
    priority: "BAJA" | "MEDIA" | "ALTA" | "URGENTE";
    deletedAt?: string | null;
    department?: { name: string } | null;
  };
}