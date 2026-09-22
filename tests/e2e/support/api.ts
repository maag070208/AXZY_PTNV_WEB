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

export type Estado = "DISPONIBLE" | "PRESTADO" | "DANADO" | "MANTENIMIENTO" | "BAJA";
export type Condicion = "BUENO" | "ACEPTABLE" | "MALO" | "ROTO";

export interface Existencias extends Record<Estado, number> {
  activa: number;
  historica: number;
}

export interface TipoDispositivo {
  id: string;
  code: string;
  name: string;
  folioPrefix: string;
  contador: number;
}

export interface Dispositivo {
  id: string;
  tipoId: string;
  nombre: string;
  marca: string;
  modelo: string;
}

export interface Unidad {
  id: string;
  activoFijo: string;
  estado: Estado;
  numeroSerie: string | null;
}

export interface Movimiento {
  id: string;
  tipo: string;
  motivo: string | null;
  status: "ACTIVO" | "CANCELADO";
  detalles: { dispositivoId: string; cantidad: number; condicion: Condicion | null }[];
}

export interface Prestamo {
  id: string;
  consecutivo: string;
  status: "ACTIVO" | "PARCIAL" | "DEVUELTO" | "CANCELADO";
  movimientoId: string | null;
  detalles: { id: string; dispositivoId: string; cantidad: number; devuelto: number }[];
}

export interface Usuario {
  id: string;
  username: string;
  name: string;
  numeroEmpleado: string | null;
  departmentId: string | null;
}

export const crearContextoApi = async (): Promise<APIRequestContext> => {
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

export class ApiInventario {
  constructor(private readonly api: APIRequestContext) {}

  private async json<T>(res: Awaited<ReturnType<APIRequestContext["get"]>>, accion: string, esperado: number): Promise<T> {
    if (res.status() !== esperado) {
      throw new Error(`${accion}: HTTP ${res.status()} → ${await res.text()}`);
    }
    return (await res.json()) as T;
  }

  async crearTipo(input: {
    code: string;
    name: string;
    folioPrefix: string;
    useSerie?: boolean;
    useMac?: boolean;
    useIp?: boolean;
    useEquipo?: boolean;
  }): Promise<TipoDispositivo> {
    return this.json(await this.api.post("inventario/tipos", { data: input }), "crearTipo", 201);
  }

  async crearDispositivo(input: {
    tipoId: string;
    nombre: string;
    marca: string;
    modelo: string;
    cantidadInicial?: number;
  }): Promise<Dispositivo> {
    return this.json(
      await this.api.post("inventario/dispositivos", { data: input }),
      "crearDispositivo",
      201
    );
  }

  async listarDispositivos(filtros: { tipoId?: string; q?: string } = {}): Promise<Dispositivo[]> {
    const qs = new URLSearchParams(
      Object.entries(filtros).filter(([, v]) => v !== undefined) as [string, string][]
    ).toString();
    return this.json(
      await this.api.get(`inventario/dispositivos${qs ? `?${qs}` : ""}`),
      "listarDispositivos",
      200
    );
  }

  /** Resuelve el dispositivo que acaba de crear la pantalla, por tipo y nombre. */
  async buscarDispositivo(tipoId: string, nombre: string): Promise<Dispositivo> {
    const lista = await this.listarDispositivos({ tipoId });
    const dispositivo = lista.find((d) => d.nombre === nombre);
    if (!dispositivo) {
      throw new Error(
        `No existe un dispositivo "${nombre}" en el tipo ${tipoId}; hay: ${lista
          .map((d) => d.nombre)
          .join(", ") || "(ninguno)"}`
      );
    }
    return dispositivo;
  }

  async existencias(dispositivoId: string): Promise<Existencias> {
    return this.json(
      await this.api.get(`inventario/dispositivos/${dispositivoId}/existencias`),
      "existencias",
      200
    );
  }

  async unidades(dispositivoId: string): Promise<Unidad[]> {
    return this.json(
      await this.api.get(`inventario/dispositivos/${dispositivoId}/unidades`),
      "unidades",
      200
    );
  }

  async movimientos(filtros: { dispositivoId?: string; tipo?: string } = {}): Promise<Movimiento[]> {
    const qs = new URLSearchParams(
      Object.entries(filtros).filter(([, v]) => v !== undefined) as [string, string][]
    ).toString();
    return this.json(
      await this.api.get(`inventario/movimientos${qs ? `?${qs}` : ""}`),
      "movimientos",
      200
    );
  }

  async prestamos(): Promise<Prestamo[]> {
    return this.json(await this.api.get("inventario/prestamos"), "prestamos", 200);
  }

  async prestamo(id: string): Promise<Prestamo> {
    return this.json(await this.api.get(`inventario/prestamos/${id}`), "prestamo", 200);
  }

  /** Préstamo creado por API (preparación), devolviendo la entidad de negocio. */
  async prestar(input: {
    departamentoId?: string;
    responsableId?: string;
    detalles: { dispositivoId: string; cantidad: number }[];
  }): Promise<Prestamo> {
    const movimiento = await this.json<{ id: string }>(
      await this.api.post("inventario/prestamos", { data: input }),
      "prestar",
      201
    );
    const lista = await this.prestamos();
    const prestamo = lista.find((p) => p.movimientoId === movimiento.id);
    if (!prestamo) throw new Error(`No hay préstamo ligado al movimiento ${movimiento.id}`);
    return prestamo;
  }

  async departamentos(): Promise<{ id: string; name: string }[]> {
    return this.json(await this.api.get("departments"), "departamentos", 200);
  }

  /** Usuarios (ADMIN) — para ligar un préstamo a un responsable real. */
  async usuarios(): Promise<Usuario[]> {
    return this.json(await this.api.get("users"), "usuarios", 200);
  }

  /** Espera a que las existencias lleguen al estado esperado (la UI es asíncrona). */
  async esperarExistencias(
    dispositivoId: string,
    esperado: Partial<Existencias>,
    timeoutMs = 10_000
  ): Promise<Existencias> {
    const limite = Date.now() + timeoutMs;
    let ultima: Existencias | null = null;
    while (Date.now() < limite) {
      ultima = await this.existencias(dispositivoId);
      if (Object.entries(esperado).every(([k, v]) => ultima![k as keyof Existencias] === v)) {
        return ultima;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    throw new Error(
      `Las existencias nunca llegaron a ${JSON.stringify(esperado)}; última lectura ${JSON.stringify(ultima)}`
    );
  }
}
