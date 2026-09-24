import { test as base, expect, type APIRequestContext } from "@playwright/test";
import { E2E_PREFIX, nuevoRunId } from "./env";
import { ApiInventario, crearContextoApi, type Dispositivo, type TipoDispositivo } from "./api";
import { ApiTickets, type Ticket, type TicketAssignment } from "./ticketsApi";
import { AltaDispositivoPage } from "./pages/AltaDispositivoPage";
import { LoginPage } from "./pages/LoginPage";
import { NuevaDevolucionPage } from "./pages/NuevaDevolucionPage";
import { NuevoMovimientoPage } from "./pages/NuevoMovimientoPage";
import { NuevoPrestamoPage } from "./pages/NuevoPrestamoPage";
import { TicketsPage } from "./pages/TicketsPage";

const RUN_ID = nuevoRunId();
let secuencia = 0;

/**
 * Tipo de dispositivo exclusivo del test, con fábrica de dispositivos encima.
 *
 * Aísla cada test: nadie más mueve estas existencias y los folios arrancan en
 * `-0001`, así que las aserciones son deterministas. Los dispositivos se
 * siembran por API porque lo que se prueba es la pantalla del flujo, no la
 * preparación.
 */
export class Escenario {
  constructor(
    readonly api: ApiInventario,
    readonly tipo: TipoDispositivo
  ) {}

  async dispositivo(
    cantidad: number,
    nombre?: string
  ): Promise<Dispositivo & { nombreVisible: string }> {
    secuencia += 1;
    const nombreFinal = nombre ?? `Equipo ${RUN_ID}-${secuencia}`;
    const dispositivo = await this.api.crearDispositivo({
      tipoId: this.tipo.id,
      nombre: nombreFinal,
      marca: "MarcaPrueba",
      modelo: "ModeloPrueba",
      cantidadInicial: cantidad,
    });
    return { ...dispositivo, nombreVisible: nombreFinal };
  }

  /** Nombre único para dar de alta desde la pantalla. */
  nombreNuevo(prefijo = "Alta UI"): string {
    secuencia += 1;
    return `${prefijo} ${RUN_ID}-${secuencia}`;
  }
}

/**
 * Ticket exclusivo del test, con fábrica de asignaciones encima.
 *
 * El título arranca con `E2E ` a propósito: es el criterio con el que la
 * limpieza del paquete `api/` barre los residuos. Sembrar por API (y no por
 * pantalla) es lo que permite que cada test se concentre en la pantalla que
 * prueba.
 */
export class TicketEscenario {
  constructor(
    readonly tickets: ApiTickets,
    readonly ticket: Ticket,
    readonly titulo: string
  ) {}

  async asignarA(username: string, title = `Tarea ${this.titulo}`): Promise<TicketAssignment> {
    const userId = await this.tickets.usuarioPorUsername(username);
    return this.tickets.asignar(this.ticket.id, { userId, title });
  }
}

interface Fixtures {
  login: LoginPage;
  altaPage: AltaDispositivoPage;
  prestamoPage: NuevoPrestamoPage;
  movimientoPage: NuevoMovimientoPage;
  devolucionPage: NuevaDevolucionPage;
  ticketsPage: TicketsPage;
  escenario: Escenario;
  departamento: { id: string; name: string };
  ticketEscenario: TicketEscenario;
}

interface WorkerFixtures {
  ctxApi: APIRequestContext;
  api: ApiInventario;
  tickets: ApiTickets;
}

export const test = base.extend<Fixtures, WorkerFixtures>({
  ctxApi: [
    async ({}, use) => {
      const ctx = await crearContextoApi();
      await use(ctx);
      await ctx.dispose();
    },
    { scope: "worker" },
  ],

  api: [
    async ({ ctxApi }, use) => {
      await use(new ApiInventario(ctxApi));
    },
    { scope: "worker" },
  ],

  tickets: [
    async ({ ctxApi }, use) => {
      await use(new ApiTickets(ctxApi));
    },
    { scope: "worker" },
  ],

  ticketEscenario: async ({ tickets }, use) => {
    secuencia += 1;
    const titulo = `${E2E_PREFIX} ${RUN_ID}-${secuencia} Ticket`;
    const ticket = await tickets.crear({
      titulo,
      descripcion: `Descripción E2E ${RUN_ID}-${secuencia}`,
    });
    await use(new TicketEscenario(tickets, ticket, titulo));
  },

  escenario: async ({ api }, use) => {
    secuencia += 1;
    const marca = `${E2E_PREFIX}${RUN_ID}${String(secuencia).padStart(3, "0")}`;
    const tipo = await api.crearTipo({
      code: marca,
      name: `Tipo UI ${marca}`,
      folioPrefix: marca,
      useSerie: true,
    });
    await use(new Escenario(api, tipo));
  },

  departamento: async ({ api }, use) => {
    const [primero] = await api.departamentos();
    if (!primero) throw new Error("No hay departamentos en la base; el seed no corrió");
    await use(primero);
  },

  login: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  altaPage: async ({ page }, use) => {
    await use(new AltaDispositivoPage(page));
  },
  prestamoPage: async ({ page }, use) => {
    await use(new NuevoPrestamoPage(page));
  },
  movimientoPage: async ({ page }, use) => {
    await use(new NuevoMovimientoPage(page));
  },
  devolucionPage: async ({ page }, use) => {
    await use(new NuevaDevolucionPage(page));
  },
  ticketsPage: async ({ page }, use) => {
    await use(new TicketsPage(page));
  },
});

export { expect };
