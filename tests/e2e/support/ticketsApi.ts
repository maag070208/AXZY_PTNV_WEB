import { request, type APIRequestContext } from "@playwright/test";
import { E2E, apiBase } from "./env";

/**
 * Acceso directo a la API real del módulo `tickets`, para dos cosas:
 *
 *  - **sembrar** el escenario de cada test (un ticket con sus tareas exige
 *    varios formularios; aquí es una llamada), y
 *  - **verificar** el efecto de lo que se hizo por pantalla contra el backend,
 *    no sólo contra lo que la pantalla dice de sí misma.
 *
 * Reutiliza el contrato real de `api/src/modules/tickets`: no inventa campos.
 */

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";
export type TicketPriority = "RETIREMENT" | "MEDIUM" | "HIGH" | "URGENT";
export type AssignmentStatus = "PENDING" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED";

export interface TicketCategory {
  id: string;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  author?: { id: string; name: string; username: string } | null;
  text: string;
  createdAt: string;
}

export interface TicketAssignmentComment {
  id: string;
  assignmentId: string;
  authorId: string;
  author?: { id: string; name: string; username: string } | null;
  text: string;
  createdAt: string;
}

export interface TicketAssignment {
  id: string;
  ticketId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    username: string;
    employeeNumber?: string | null;
    jobTitle?: string | null;
  };
  title: string;
  description: string;
  startDate?: string | null;
  dueDate?: string | null;
  status: AssignmentStatus;
  comments?: TicketAssignmentComment[];
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  categoryId?: string | null;
  category?: TicketCategory | null;
  createdById: string;
  createdBy?: { id: string; name: string; username: string } | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; username: string } | null;
  departmentId?: string | null;
  closedAt?: string | null;
  closedBy?: string | null;
  deletedAt?: string | null;
  assignments: TicketAssignment[];
  comments: TicketComment[];
  createdAt: string;
}

export interface KanbanAssignment {
  id: string;
  ticketId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    username: string;
    employeeNumber?: string | null;
    jobTitle?: string | null;
  };
  title: string;
  description: string;
  startDate?: string | null;
  dueDate?: string | null;
  status: AssignmentStatus;
  ticket: {
    id: string;
    title: string;
    status: TicketStatus;
    priority: TicketPriority;
    deletedAt?: string | null;
    department?: { name: string } | null;
  };
}

export interface User {
  id: string;
  username: string;
  name: string;
  role?: string;
}

export interface TableResult<T> {
  data: T[];
  total: number;
}

export interface TicketDeleteResult {
  soft: boolean;
  data: Ticket;
}

/** Contexto autenticado como un usuario concreto (para verificar los 403). */
export const createContextApiAs = async (username: string): Promise<APIRequestContext> => {
  const anon = await request.newContext({ baseURL: apiBase });
  const res = await anon.post("auth/login", {
    data: { username, password: E2E.password },
  });
  if (res.status() !== 200) {
    throw new Error(
      `No se pudo autenticar "${username}" contra la API (${res.status()}). ` +
        `Corre "npm run test:e2e:provision" en ../api. → ${await res.text()}`
    );
  }
  const { token } = (await res.json()) as { token: string };
  await anon.dispose();

  return request.newContext({
    baseURL: apiBase,
    extraHTTPHeaders: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
};

export class ApiTickets {
  constructor(private readonly api: APIRequestContext) {}

  private async json<T>(
    res: Awaited<ReturnType<APIRequestContext["get"]>>,
    action: string,
    expected: number
  ): Promise<T> {
    if (res.status() !== expected) {
      throw new Error(`${action}: HTTP ${res.status()} → ${await res.text()}`);
    }
    return (await res.json()) as T;
  }

  async list(filters: { q?: string } = {}): Promise<TableResult<Ticket>> {
    const qs = filters.q ? `?q=${encodeURIComponent(filters.q)}` : "";
    return this.json(await this.api.get(`tickets${qs}`), "list", 200);
  }

  async query(body: {
    page?: number;
    limit?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: { key: string; direction: "asc" | "desc" };
  }): Promise<TableResult<Ticket>> {
    return this.json(
      await this.api.post("tickets/query", { data: { page: 1, limit: 10, ...body } }),
      "query",
      200
    );
  }

  async kanban(ticketId?: string): Promise<TableResult<KanbanAssignment>> {
    const qs = ticketId ? `?ticketId=${ticketId}` : "";
    return this.json(await this.api.get(`tickets/kanban${qs}`), "kanban", 200);
  }

  /** Detalle del ticket; lanza si la API no responde 200. */
  async get(id: string): Promise<Ticket> {
    return this.json(await this.api.get(`tickets/${id}`), "get", 200);
  }

  /** Detalle del ticket; 404 → `null` (para verificar el borrado físico). */
  async getOptional(id: string): Promise<Ticket | null> {
    const res = await this.api.get(`tickets/${id}`);
    if (res.status() === 404) return null;
    if (res.status() !== 200) {
      throw new Error(`obtenerOpcional: HTTP ${res.status()} → ${await res.text()}`);
    }
    return (await res.json()) as Ticket;
  }

  async create(input: {
    title: string;
    description: string;
    priority?: TicketPriority;
    categoryId?: string;
    departmentId?: string;
    assignedToId?: string;
  }): Promise<Ticket> {
    return this.json(await this.api.post("tickets", { data: input }), "create", 201);
  }

  async update(
    id: string,
    data: Partial<{
      status: TicketStatus;
      priority: TicketPriority;
      categoryId: string | null;
      assignedToId: string | null;
      departmentId: string | null;
    }>
  ): Promise<Ticket> {
    return this.json(await this.api.put(`tickets/${id}`, { data }), "update", 200);
  }

  /** Primera llamada: soft (papelera). Segunda: físico. */
  async remove(id: string): Promise<TicketDeleteResult> {
    return this.json(await this.api.delete(`tickets/${id}`), "remove", 200);
  }

  async categories(includeInactive = false): Promise<TicketCategory[]> {
    const qs = includeInactive ? "?includeInactive=true" : "";
    return this.json(await this.api.get(`tickets/categories${qs}`), "categories", 200);
  }

  async createCategory(name: string): Promise<TicketCategory> {
    return this.json(
      await this.api.post("tickets/categories", { data: { name } }),
      "createCategory",
      201
    );
  }

  async updateCategory(
    id: string,
    data: { name?: string; active?: boolean }
  ): Promise<TicketCategory> {
    return this.json(
      await this.api.patch(`tickets/categories/${id}`, { data }),
      "updateCategory",
      200
    );
  }

  async deleteCategory(id: string): Promise<{ soft: boolean; data: TicketCategory }> {
    return this.json(
      await this.api.delete(`tickets/categories/${id}`),
      "deleteCategory",
      200
    );
  }

  async comment(id: string, text: string): Promise<TicketComment> {
    return this.json(
      await this.api.post(`tickets/${id}/comments`, { data: { text } }),
      "comment",
      201
    );
  }

  async assign(
    id: string,
    data: {
      userId: string;
      title: string;
      description?: string;
      startDate?: string | null;
      dueDate?: string | null;
    }
  ): Promise<TicketAssignment> {
    return this.json(
      await this.api.post(`tickets/${id}/assignments`, { data }),
      "assign",
      201
    );
  }

  async updateAssignment(
    id: string,
    assignmentId: string,
    data: {
      title?: string;
      description?: string;
      status?: AssignmentStatus;
      startDate?: string | null;
      dueDate?: string | null;
    }
  ): Promise<TicketAssignment> {
    return this.json(
      await this.api.put(`tickets/${id}/assignments/${assignmentId}`, { data }),
      "updateAssignment",
      200
    );
  }

  async users(): Promise<User[]> {
    return this.json(await this.api.get("users"), "users", 200);
  }

  async userByUsername(username: string): Promise<string> {
    const user = (await this.users()).find((u) => u.username === username);
    if (!user) {
      throw new Error(
        `"${username}" no está provisionado. Corre "npm run test:e2e:provision" en ../api.`
      );
    }
    return user.id;
  }

  /** Busca por título (filtro `contains` del backend) y devuelve la coincidencia exacta. */
  async searchByTitle(title: string): Promise<Ticket | null> {
    const res = await this.query({ page: 1, limit: 50, filters: { title } });
    return res.data.find((t) => t.title === title) ?? null;
  }

  /** Espera a que el ticket cumpla un predicado (la UI es asíncrona). */
  async waitForTicket(
    id: string,
    predicate: (ticket: Ticket) => boolean,
    timeoutMs = 10_000
  ): Promise<Ticket> {
    const limit = Date.now() + timeoutMs;
    let last: Ticket | null = null;
    while (Date.now() < limit) {
      last = await this.get(id);
      if (predicate(last)) return last;
      await new Promise((r) => setTimeout(r, 250));
    }
    throw new Error(
      `El ticket ${id} nunca cumplió la condición; última lectura: ${JSON.stringify(last)}`
    );
  }
}
