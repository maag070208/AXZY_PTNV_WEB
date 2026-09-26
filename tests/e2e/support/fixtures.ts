import { test as base, expect, type APIRequestContext } from "@playwright/test";
import { E2E_PREFIX, newRunId } from "./env";
import { ApiInventory, createContextApi, type Device, type DeviceType } from "./api";
import { ApiTickets, type Ticket, type TicketAssignment } from "./ticketsApi";
import { DeviceRegistrationPage } from "./pages/DeviceRegistrationPage";
import { LoginPage } from "./pages/LoginPage";
import { NewLoanReturnPage } from "./pages/NewLoanReturnPage";
import { NewMovementPage } from "./pages/NewMovementPage";
import { NewLoanPage } from "./pages/NewLoanPage";
import { TicketsPage } from "./pages/TicketsPage";

const RUN_ID = newRunId();
let sequence = 0;

/**
 * Tipo de dispositivo exclusivo del test, con fábrica de dispositivos encima.
 *
 * Aísla cada test: nadie más mueve estas existencias y los folios arrancan en
 * `-0001`, así que las aserciones son deterministas. Los dispositivos se
 * siembran por API porque lo que se prueba es la pantalla del flujo, no la
 * preparación.
 */
export class Scenario {
  constructor(
    readonly api: ApiInventory,
    readonly type: DeviceType
  ) {}

  async device(
    quantity: number,
    name?: string
  ): Promise<Device & { nameVisible: string }> {
    sequence += 1;
    const finalName = name ?? `Equipo ${RUN_ID}-${sequence}`;
    const device = await this.api.createDevice({
      typeId: this.type.id,
      name: finalName,
      brand: "TestBrand",
      model: "TestModel",
      initialQuantity: quantity,
    });
    return { ...device, nameVisible: finalName };
  }

  /** Nombre único para dar de alta desde la pantalla. */
  newName(prefix = "Alta UI"): string {
    sequence += 1;
    return `${prefix} ${RUN_ID}-${sequence}`;
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
export class TicketScenario {
  constructor(
    readonly tickets: ApiTickets,
    readonly ticket: Ticket,
    readonly title: string
  ) {}

  async assignA(username: string, title = `Tarea ${this.title}`): Promise<TicketAssignment> {
    const userId = await this.tickets.userByUsername(username);
    return this.tickets.assign(this.ticket.id, { userId, title });
  }
}

interface Fixtures {
  login: LoginPage;
  registrationPage: DeviceRegistrationPage;
  loanPage: NewLoanPage;
  movementPage: NewMovementPage;
  loanReturnPage: NewLoanReturnPage;
  ticketsPage: TicketsPage;
  scenario: Scenario;
  department: { id: string; name: string };
  ticketScenario: TicketScenario;
}

interface WorkerFixtures {
  ctxApi: APIRequestContext;
  api: ApiInventory;
  tickets: ApiTickets;
}

export const test = base.extend<Fixtures, WorkerFixtures>({
  ctxApi: [
    async ({}, use) => {
      const ctx = await createContextApi();
      await use(ctx);
      await ctx.dispose();
    },
    { scope: "worker" },
  ],

  api: [
    async ({ ctxApi }, use) => {
      await use(new ApiInventory(ctxApi));
    },
    { scope: "worker" },
  ],

  tickets: [
    async ({ ctxApi }, use) => {
      await use(new ApiTickets(ctxApi));
    },
    { scope: "worker" },
  ],

  ticketScenario: async ({ tickets }, use) => {
    sequence += 1;
    const title = `${E2E_PREFIX} ${RUN_ID}-${sequence} Ticket`;
    const ticket = await tickets.create({
      title,
      description: `Descripción E2E ${RUN_ID}-${sequence}`,
    });
    await use(new TicketScenario(tickets, ticket, title));
  },

  scenario: async ({ api }, use) => {
    sequence += 1;
    const brand = `${E2E_PREFIX}${RUN_ID}${String(sequence).padStart(3, "0")}`;
    const type = await api.createType({
      code: brand,
      name: `Tipo UI ${brand}`,
      assetTagPrefix: brand,
      useSerialNumber: true,
    });
    await use(new Scenario(api, type));
  },

  department: async ({ api }, use) => {
    const [first] = await api.departments();
    if (!first) throw new Error("No hay departamentos en la base; el seed no corrió");
    await use(first);
  },

  login: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registrationPage: async ({ page }, use) => {
    await use(new DeviceRegistrationPage(page));
  },
  loanPage: async ({ page }, use) => {
    await use(new NewLoanPage(page));
  },
  movementPage: async ({ page }, use) => {
    await use(new NewMovementPage(page));
  },
  loanReturnPage: async ({ page }, use) => {
    await use(new NewLoanReturnPage(page));
  },
  ticketsPage: async ({ page }, use) => {
    await use(new TicketsPage(page));
  },
});

export { expect };
