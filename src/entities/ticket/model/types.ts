export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  author: { id: string; name: string; username: string };
  text: string;
  createdAt: string;
}

export interface TicketHistoryEntry {
  id: string;
  ticketId: string;
  type: string;
  detail?: string | null;
  author?: { id: string; name: string; username: string } | null;
  createdAt: string;
}

export interface TicketAssignmentComment {
  id: string;
  assignmentId: string;
  authorId: string;
  author: { id: string; name: string; username: string };
  text: string;
  createdAt: string;
}

export type AssignmentStatus = "PENDING" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED";

export interface TicketAssignment {
  id: string;
  ticketId: string;
  userId: string;
  user: { id: string; name: string; username: string; employeeNumber?: string | null; jobTitle?: string | null };
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

export interface TicketCategory {
  id: string;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  categoryId?: string | null;
  category?: TicketCategory | null;
  createdById: string;
  createdBy: { id: string; name: string; username: string; jobTitle?: string };
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; username: string; jobTitle?: string } | null;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  closedAt?: string | null;
  closedBy?: string | null;
  deletedAt?: string | null;
  assignments: TicketAssignment[];
  attachments?: TicketAttachment[];
  comments: TicketComment[];
  history: TicketHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketInput {
  title: string;
  description: string;
  priority?: string;
  categoryId?: string;
  departmentId?: string;
  assignedToId?: string;
}

export interface KanbanAssignment {
  id: string;
  ticketId: string;
  userId: string;
  user: { id: string; name: string; username: string; employeeNumber?: string | null; jobTitle?: string | null };
  title: string;
  description: string;
  startDate?: string | null;
  dueDate?: string | null;
  status: AssignmentStatus;
  createdAt: string;
  comments?: TicketAssignmentComment[];
  ticket: {
    id: string;
    title: string;
    status: "OPEN" | "IN_PROGRESS" | "CLOSED";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    deletedAt?: string | null;
    department?: { name: string } | null;
  };
}