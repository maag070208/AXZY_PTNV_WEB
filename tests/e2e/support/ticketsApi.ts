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

export type TicketStatus = "ABIERTO" | "EN_SEGUIMIENTO" | "CERRADO";
export type TicketPriority = "BAJA" | "MEDIA" | "ALTA" | "URGENTE";
export type AssignmentStatus = "PENDIENTE" | "EN_PROGRESO" | "EN_REVISION" | "COMPLETADA";

export interface TicketCategory {
  id: string;
  nombre: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  autorId: string;
  autor?: { id: string; name: string; username: string } | null;
  texto: string;
  creadoEn: string;
}

export interface TicketAssignmentComment {
  id: string;
  assignmentId: string;
  autorId: string;
  autor?: { id: string; name: string; username: string } | null;
  texto: string;
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
    numeroEmpleado?: string | null;
    puesto?: string | null;
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
  titulo: string;
  descripcion: string;
  status: TicketStatus;
  priority: TicketPriority;
  categoryId?: string | null;
  category?: TicketCategory | null;
  creadoPorId: string;
  creadoPor?: { id: string; name: string; username: string } | null;
  asignadoAId?: string | null;
  asignadoA?: { id: string; name: string; username: string } | null;
  departmentId?: string | null;
  closedAt?: string | null;
  closedBy?: string | null;
  deletedAt?: string | null;
  assignments: TicketAssignment[];
  comments: TicketComment[];
  creadoEn: string;
}

export interface KanbanAssignment {
  id: string;
  ticketId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    username: string;
    numeroEmpleado?: string | null;
    puesto?: string | null;
  };
  title: string;
  description: string;
  startDate?: string | null;
  dueDate?: string | null;
  status: AssignmentStatus;
  ticket: {
    id: string;
    titulo: string;
    status: TicketStatus;
    priority: TicketPriority;
    deletedAt?: string | null;
    department?: { name: string } | null;
  };
}

export interface Usuario {
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
export const crearContextoApiComo = async (username: string): Promise<APIRequestContext> => {
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
    accion: string,
    esperado: number
  ): Promise<T> {
    if (res.status() !== esperado) {
      throw new Error(`${accion}: HTTP ${res.status()} → ${await res.text()}`);
    }
    return (await res.json()) as T;
  }

  async listar(filtros: { q?: string } = {}): Promise<TableResult<Ticket>> {
    const qs = filtros.q ? `?q=${encodeURIComponent(filtros.q)}` : "";
    return this.json(await this.api.get(`tickets${qs}`), "listar", 200);
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
  async obtener(id: string): Promise<Ticket> {
    return this.json(await this.api.get(`tickets/${id}`), "obtener", 200);
  }

  /** Detalle del ticket; 404 → `null` (para verificar el borrado físico). */
  async obtenerOpcional(id: string): Promise<Ticket | null> {
    const res = await this.api.get(`tickets/${id}`);
    if (res.status() === 404) return null;
    if (res.status() !== 200) {
      throw new Error(`obtenerOpcional: HTTP ${res.status()} → ${await res.text()}`);
    }
    return (await res.json()) as Ticket;
  }

  async crear(input: {
    titulo: string;
    descripcion: string;
    priority?: TicketPriority;
    categoryId?: string;
    departmentId?: string;
    asignadoAId?: string;
  }): Promise<Ticket> {
    return this.json(await this.api.post("tickets", { data: input }), "crear", 201);
  }

  async actualizar(
    id: string,
    data: Partial<{
      status: TicketStatus;
      priority: TicketPriority;
      categoryId: string | null;
      asignadoAId: string | null;
      departmentId: string | null;
    }>
  ): Promise<Ticket> {
    return this.json(await this.api.put(`tickets/${id}`, { data }), "actualizar", 200);
  }

  /** Primera llamada: soft (papelera). Segunda: físico. */
  async borrar(id: string): Promise<TicketDeleteResult> {
    return this.json(await this.api.delete(`tickets/${id}`), "borrar", 200);
  }

  async categorias(includeInactive = false): Promise<TicketCategory[]> {
    const qs = includeInactive ? "?includeInactive=true" : "";
    return this.json(await this.api.get(`tickets/categories${qs}`), "categorias", 200);
  }

  async crearCategoria(nombre: string): Promise<TicketCategory> {
    return this.json(
      await this.api.post("tickets/categories", { data: { nombre } }),
      "crearCategoria",
      201
    );
  }

  async actualizarCategoria(
    id: string,
    data: { nombre?: string; activo?: boolean }
  ): Promise<TicketCategory> {
    return this.json(
      await this.api.patch(`tickets/categories/${id}`, { data }),
      "actualizarCategoria",
      200
    );
  }

  async eliminarCategoria(id: string): Promise<{ soft: boolean; data: TicketCategory }> {
    return this.json(
      await this.api.delete(`tickets/categories/${id}`),
      "eliminarCategoria",
      200
    );
  }

  async comentar(id: string, texto: string): Promise<TicketComment> {
    return this.json(
      await this.api.post(`tickets/${id}/comments`, { data: { texto } }),
      "comentar",
      201
    );
  }

  async asignar(
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
      "asignar",
      201
    );
  }

  async actualizarAsignacion(
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
      "actualizarAsignacion",
      200
    );
  }

  async usuarios(): Promise<Usuario[]> {
    return this.json(await this.api.get("users"), "usuarios", 200);
  }

  async usuarioPorUsername(username: string): Promise<string> {
    const usuario = (await this.usuarios()).find((u) => u.username === username);
    if (!usuario) {
      throw new Error(
        `"${username}" no está provisionado. Corre "npm run test:e2e:provision" en ../api.`
      );
    }
    return usuario.id;
  }

  /** Busca por título (filtro `contains` del backend) y devuelve la coincidencia exacta. */
  async buscarPorTitulo(titulo: string): Promise<Ticket | null> {
    const res = await this.query({ page: 1, limit: 50, filters: { titulo } });
    return res.data.find((t) => t.titulo === titulo) ?? null;
  }

  /** Espera a que el ticket cumpla un predicado (la UI es asíncrona). */
  async esperarTicket(
    id: string,
    predicado: (ticket: Ticket) => boolean,
    timeoutMs = 10_000
  ): Promise<Ticket> {
    const limite = Date.now() + timeoutMs;
    let ultimo: Ticket | null = null;
    while (Date.now() < limite) {
      ultimo = await this.obtener(id);
      if (predicado(ultimo)) return ultimo;
      await new Promise((r) => setTimeout(r, 250));
    }
    throw new Error(
      `El ticket ${id} nunca cumplió la condición; última lectura: ${JSON.stringify(ultimo)}`
    );
  }
}
