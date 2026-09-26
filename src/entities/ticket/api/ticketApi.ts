import { api } from "@shared/api/client";
import {
  tableRequest,
  type ITDataTableFetchParamsPost,
} from "@shared/api/table";
import type {
  KanbanAssignment,
  Ticket,
  TicketAssignment,
  TicketAssignmentComment,
  TicketAttachment,
  TicketCategory,
  TicketComment,
  TicketInput,
} from "../model/types";

export const ticketsApi = {
  table: (params: ITDataTableFetchParamsPost) =>
    tableRequest<Ticket>(`/tickets/query`, params),
  list: (search?: string) => {
    const qs = search ? `?q=${encodeURIComponent(search)}` : "";
    return api.get<{ data: Ticket[]; total: number }>(`/tickets${qs}`);
  },
  kanban: (ticketId?: string) => {
    const qs = ticketId ? `?ticketId=${ticketId}` : "";
    return api.get<{ data: KanbanAssignment[]; total: number }>(`/tickets/kanban${qs}`);
  },
  get: (id: string) => api.get<Ticket>(`/tickets/${id}`),
  attachments: (id: string) => api.get<TicketAttachment[]>(`/tickets/${id}/attachments`),
  downloadAttachment: (id: string, attachmentId: string) =>
    api.get<Blob>(`/tickets/${id}/attachments/${attachmentId}/download`, { responseType: "blob" }),
  uploadAttachment: (id: string, file: File, kind = "PHOTO") => {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    return api.post<TicketAttachment>(`/tickets/${id}/attachments`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  assignmentAttachments: (id: string, assignmentId: string) =>
    api.get<TicketAttachment[]>(`/tickets/${id}/assignments/${assignmentId}/attachments`),
  downloadAssignmentAttachment: (id: string, assignmentId: string, attachmentId: string) =>
    api.get<Blob>(`/tickets/${id}/assignments/${assignmentId}/attachments/${attachmentId}/download`, { responseType: "blob" }),
  uploadAssignmentAttachment: (id: string, assignmentId: string, file: File, kind = "EVIDENCIA") => {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    return api.post<TicketAttachment>(`/tickets/${id}/assignments/${assignmentId}/attachments`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  create: (input: TicketInput) => api.post<Ticket>(`/tickets`, input),
  update: (id: string, data: Partial<{
    status: string;
    priority: string;
    categoryId: string | null;
    assignedToId: string | null;
    departmentId: string | null;
  }>) => api.put<Ticket>(`/tickets/${id}`, data),
  remove: (id: string) => api.delete<{ soft: boolean; data: Ticket }>(`/tickets/${id}`),
  categories: (includeInactive?: boolean) =>
    api.get<TicketCategory[]>(
      `/tickets/categories${includeInactive ? "?includeInactive=true" : ""}`
    ),
  createCategory: (name: string) =>
    api.post<TicketCategory>(`/tickets/categories`, { name }),
  updateCategory: (id: string, data: { name?: string; active?: boolean }) =>
    api.patch<TicketCategory>(`/tickets/categories/${id}`, data),
  deleteCategory: (id: string) =>
    api.delete<{ soft: boolean; data: TicketCategory }>(`/tickets/categories/${id}`),
  addComment: (id: string, text: string) =>
    api.post<TicketComment>(`/tickets/${id}/comments`, { text }),
  addAssignment: (
    id: string,
    data: {
      userId: string;
      title: string;
      description?: string;
      startDate?: string | null;
      dueDate?: string | null;
    }
  ) => api.post<TicketAssignment>(`/tickets/${id}/assignments`, data),
  updateAssignment: (
    id: string,
    assignmentId: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
      startDate?: string | null;
      dueDate?: string | null;
    }
  ) => api.put<TicketAssignment>(`/tickets/${id}/assignments/${assignmentId}`, data),
  removeAssignment: (id: string, assignmentId: string) =>
    api.delete<TicketAssignment>(`/tickets/${id}/assignments/${assignmentId}`),
  addAssignmentComment: (id: string, assignmentId: string, text: string) =>
    api.post<TicketAssignmentComment>(`/tickets/${id}/assignments/${assignmentId}/comments`, {
      text,
    }),
};