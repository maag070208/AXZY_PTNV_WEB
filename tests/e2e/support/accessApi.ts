import type { APIRequestContext } from "@playwright/test";
import { E2E } from "./env";

/**
 * Acceso directo a la API del módulo `access`, para **sembrar** el escenario
 * de la bitácora (crear eventos exige alternar ENTRY/EXIT y respetar la ventana
 * anti-duplicado; hacerlo por pantalla no es lo que se prueba aquí) y para
 * **verificar** contra el backend lo que la tabla muestra.
 *
 * Reutiliza el contrato real de `api/src/modules/access`: no inventa campos.
 */

export interface AccessSite {
  id: string;
  name: string;
  code: string | null;
  active: boolean;
}

export interface AccessEvent {
  id: string;
  type: "ENTRY" | "EXIT";
  occurredAt: string;
  employeeId: string;
  employeeNameSnapshot: string | null;
  siteId: string | null;
  locationSource: "GPS" | "SITE_ONLY" | "MANUAL";
  method: "QR_SCAN" | "MANUAL";
  voidedAt: string | null;
  voidReason: string | null;
}

export interface AccessQueryResult {
  page: number;
  limit: number;
  total: number;
  data: AccessEvent[];
}

export interface UsuarioBasico {
  id: string;
  username: string;
  name: string;
}

export interface AccessReportSessionRow {
  id: string;
  employeeId: string;
  employeeName: string;
  numeroEmpleado: string | null;
  puesto: string | null;
  departmentId: string | null;
  departmentName: string | null;
  active: boolean;
  /** Día local (YYYY-MM-DD) al que se atribuye la sesión. */
  date: string;
  entryAt: string | null;
  exitAt: string | null;
  workedMinutes: number;
  incident: "ENTRY_WITHOUT_EXIT" | "EXIT_WITHOUT_ENTRY" | "OPEN_ENTRY" | null;
  crossesMidnight: boolean;
}

export interface AccessReportResult {
  page: number;
  limit: number;
  total: number;
  /** Una fila por SESIÓN; una persona con N entradas/salidas genera N filas. */
  data: AccessReportSessionRow[];
  summary: {
    peopleTotal: number;
    peopleWithRecords: number;
    peopleWithoutRecords: number;
    peopleInside: number;
    totalWorkedMinutes: number;
    totalIncidents: number;
    range: { start: string; end: string; timezone: string; period: string };
  };
}

/** Payload `v:2` de la credencial (mismo esquema que genera la web). */
export const qrDe = (id: string): string => JSON.stringify({ v: 2, id });

export class ApiAccess {
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

  async sitios(): Promise<AccessSite[]> {
    return this.json(await this.api.get("access/sites"), "sitios", 200);
  }

  async crearSitio(input: { name: string; code: string }): Promise<AccessSite> {
    return this.json(await this.api.post("access/sites", { data: input }), "crearSitio", 201);
  }

  async crearEvento(input: {
    employeeId?: string;
    qr?: string;
    type: "ENTRY" | "EXIT";
    siteId: string;
    clientEventId: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  }): Promise<AccessEvent> {
    return this.json(
      await this.api.post("access/events", { data: input }),
      "crearEvento",
      201
    );
  }

  async estado(employeeId: string): Promise<{
    hasOpenEntry: boolean;
    lastEvent: { type: "ENTRY" | "EXIT" } | null;
  }> {
    return this.json(
      await this.api.get(`access/status/${employeeId}`),
      "estado",
      200
    );
  }

  async query(body: {
    page?: number;
    limit?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: { key: string; direction: "asc" | "desc" };
  }): Promise<AccessQueryResult> {
    return this.json(
      await this.api.post("access/query", { data: { page: 1, limit: 10, ...body } }),
      "query",
      200
    );
  }

  async usuarios(): Promise<UsuarioBasico[]> {
    return this.json(await this.api.get("users"), "usuarios", 200);
  }

  /** Alta de un usuario de prueba (ADMIN) para sembrar el reporte. */
  async crearUsuario(input: {
    username: string;
    name: string;
    role?: string;
    departmentId?: string;
  }): Promise<UsuarioBasico> {
    return this.json(
      await this.api.post("users", {
        data: {
          username: input.username,
          password: E2E.password,
          name: input.name,
          role: input.role ?? "EMPLEADO",
          ...(input.departmentId ? { departmentId: input.departmentId } : {}),
        },
      }),
      "crearUsuario",
      201
    );
  }

  /**
   * Alta **idempotente** de un usuario de prueba: si el username ya existe (de
   * una corrida anterior, sin eventos tras la limpieza) lo reutiliza en vez de
   * acumular cuentas nuevas en cada corrida.
   */
  async asegurarUsuario(input: {
    username: string;
    name: string;
    role?: string;
  }): Promise<UsuarioBasico> {
    const res = await this.api.post("users", {
      data: {
        username: input.username,
        password: E2E.password,
        name: input.name,
        role: input.role ?? "EMPLEADO",
      },
    });
    if (res.status() === 201) return (await res.json()) as UsuarioBasico;
    if (res.status() === 409) {
      const existente = (await this.usuarios()).find((u) => u.username === input.username);
      if (existente) return existente;
    }
    throw new Error(`asegurarUsuario: HTTP ${res.status()} → ${await res.text()}`);
  }

  /** Borra físicamente un usuario de prueba sin historial ligado. */
  async eliminarUsuario(id: string): Promise<void> {
    const res = await this.api.delete(`users/${id}?force=true`);
    if (res.status() !== 200) {
      throw new Error(`eliminarUsuario: HTTP ${res.status()} → ${await res.text()}`);
    }
  }

  /** Reporte paginado por persona (contrato ITDataTable + `summary` global). */
  async report(body: {
    page?: number;
    limit?: number;
    filters: Record<string, string | number | boolean>;
    sort?: { key: string; direction: "asc" | "desc" };
  }): Promise<AccessReportResult> {
    return this.json(
      await this.api.post("access/report", { data: { page: 1, limit: 10, ...body } }),
      "report",
      200
    );
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
}

/** Sitio demo persistente de la suite (ver `api/tests/e2e/support/env.ts`). */
export const DEMO_SITE_CODE = E2E.demoSite.code;
