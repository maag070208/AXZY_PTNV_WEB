import { request, type APIRequestContext } from "@playwright/test";
import { E2E, apiBase } from "./env";

/**
 * Acceso directo a la API real, para dos cosas:
 *
 *  - **preparar** el escenario de cada test (dar de alta un tipo y un
 *    dispositivo cuesta varios formularios; aquí es una llamada), y
 *  - **verificar** el efecto de lo que se hizo por pantalla contra el backend,
 *    no sólo contra lo que la pantalla dice de sí misma.
 *
 * Lo que se prueba es la UI; esto es andamio alrededor.
 */

export type Status = "AVAILABLE" | "ON_LOAN" | "DAMAGED" | "IN_MAINTENANCE" | "RETIREMENT";
export type Condition = "GOOD" | "FAIR" | "POOR" | "BROKEN";

export interface Stock extends Record<Status, number> {
  active: number;
  historical: number;
}

export interface DeviceType {
  id: string;
  code: string;
  name: string;
  assetTagPrefix: string;
  counter: number;
}

export interface Device {
  id: string;
  typeId: string;
  name: string;
  brand: string;
  model: string;
}

export interface Unit {
  id: string;
  assetTag: string;
  status: Status;
  serialNumber: string | null;
}

export interface Movement {
  id: string;
  type: string;
  reason: string | null;
  status: "ACTIVE" | "CANCELLED";
  items: { deviceId: string; quantity: number; condition: Condition | null }[];
}

export interface Loan {
  id: string;
  number: string;
  status: "ACTIVE" | "PARTIAL" | "RETURNED" | "CANCELLED";
  movementId: string | null;
  items: { id: string; deviceId: string; quantity: number; returnedQuantity: number }[];
}

export interface User {
  id: string;
  username: string;
  name: string;
  employeeNumber: string | null;
  departmentId: string | null;
  department?: { id: string; name: string } | null;
}

export const createContextApi = async (): Promise<APIRequestContext> => {
  const anon = await request.newContext({ baseURL: apiBase });
  const res = await anon.post("auth/login", {
    data: { username: E2E.admin.username, password: E2E.password },
  });
  if (res.status() !== 200) {
    throw new Error(
      `No se pudo autenticar "${E2E.admin.username}" contra la API (${res.status()}). ` +
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

export class ApiInventory {
  constructor(private readonly api: APIRequestContext) {}

  private async json<T>(res: Awaited<ReturnType<APIRequestContext["get"]>>, action: string, expected: number): Promise<T> {
    if (res.status() !== expected) {
      throw new Error(`${action}: HTTP ${res.status()} → ${await res.text()}`);
    }
    return (await res.json()) as T;
  }

  async createType(input: {
    code: string;
    name: string;
    assetTagPrefix: string;
    useSerialNumber?: boolean;
    useMac?: boolean;
    useIp?: boolean;
    useHostname?: boolean;
  }): Promise<DeviceType> {
    return this.json(await this.api.post("inventory/device-types", { data: input }), "createType", 201);
  }

  async createDevice(input: {
    typeId: string;
    name: string;
    brand: string;
    model: string;
    initialQuantity?: number;
  }): Promise<Device> {
    return this.json(
      await this.api.post("inventory/devices", { data: input }),
      "createDevice",
      201
    );
  }

  async listDevices(filters: { typeId?: string; q?: string } = {}): Promise<Device[]> {
    const qs = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v !== undefined) as [string, string][]
    ).toString();
    return this.json(
      await this.api.get(`inventory/devices${qs ? `?${qs}` : ""}`),
      "listDevices",
      200
    );
  }

  /** Resuelve el dispositivo que acaba de crear la pantalla, por tipo y nombre. */
  async searchDevice(typeId: string, name: string): Promise<Device> {
    const list = await this.listDevices({ typeId });
    const device = list.find((d) => d.name === name);
    if (!device) {
      throw new Error(
        `No existe un dispositivo "${name}" en el tipo ${typeId}; hay: ${list
          .map((d) => d.name)
          .join(", ") || "(ninguno)"}`
      );
    }
    return device;
  }

  async stock(deviceId: string): Promise<Stock> {
    return this.json(
      await this.api.get(`inventory/devices/${deviceId}/stock`),
      "stock",
      200
    );
  }

  async units(deviceId: string): Promise<Unit[]> {
    return this.json(
      await this.api.get(`inventory/devices/${deviceId}/units`),
      "units",
      200
    );
  }

  async movements(filters: { deviceId?: string; type?: string } = {}): Promise<Movement[]> {
    const qs = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v !== undefined) as [string, string][]
    ).toString();
    return this.json(
      await this.api.get(`inventory/movements${qs ? `?${qs}` : ""}`),
      "movements",
      200
    );
  }

  async loans(): Promise<Loan[]> {
    return this.json(await this.api.get("inventory/loans"), "loans", 200);
  }

  async loan(id: string): Promise<Loan> {
    return this.json(await this.api.get(`inventory/loans/${id}`), "loan", 200);
  }

  /** Préstamo creado por API (preparación), devolviendo la entidad de negocio. */
  async lend(input: {
    departmentId?: string;
    custodianId?: string;
    items: { deviceId: string; quantity: number }[];
  }): Promise<Loan> {
    const movement = await this.json<{ id: string }>(
      await this.api.post("inventory/loans", { data: input }),
      "lend",
      201
    );
    const list = await this.loans();
    const loan = list.find((p) => p.movementId === movement.id);
    if (!loan) throw new Error(`No hay préstamo ligado al movimiento ${movement.id}`);
    return loan;
  }

  async departments(): Promise<{ id: string; name: string }[]> {
    return this.json(await this.api.get("departments"), "departments", 200);
  }

  /** Usuarios (ADMIN) — para ligar un préstamo a un responsable real. */
  async users(): Promise<User[]> {
    return this.json(await this.api.get("users"), "users", 200);
  }

  /** Alta de un usuario de prueba (ADMIN), con o sin departamento. */
  async createUser(input: {
    username: string;
    name: string;
    departmentId?: string;
    role?: string;
  }): Promise<User> {
    return this.json(
      await this.api.post("users", {
        data: {
          username: input.username,
          password: E2E.password,
          name: input.name,
          role: input.role ?? "EMPLOYEE",
          ...(input.departmentId ? { departmentId: input.departmentId } : {}),
        },
      }),
      "createUser",
      201
    );
  }

  /**
   * Borra físicamente a un usuario de prueba. `force=true` reasigna las FKs
   * requeridas al admin para no chocar con préstamos/movimientos que lo
   * referencien (el inventario E2E lo recoge el teardown de `api/`).
   */
  async deleteUser(id: string): Promise<void> {
    await this.json(await this.api.delete(`users/${id}?force=true`), "deleteUser", 200);
  }

  /** Espera a que las existencias lleguen al estado esperado (la UI es asíncrona). */
  async waitForStock(
    deviceId: string,
    expected: Partial<Stock>,
    timeoutMs = 10_000
  ): Promise<Stock> {
    const limit = Date.now() + timeoutMs;
    let last: Stock | null = null;
    while (Date.now() < limit) {
      last = await this.stock(deviceId);
      if (Object.entries(expected).every(([k, v]) => last![k as keyof Stock] === v)) {
        return last;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    throw new Error(
      `Las existencias nunca llegaron a ${JSON.stringify(expected)}; última lectura ${JSON.stringify(last)}`
    );
  }
}
