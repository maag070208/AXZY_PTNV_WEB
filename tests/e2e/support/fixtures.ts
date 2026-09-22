import { test as base, expect, type APIRequestContext } from "@playwright/test";
import { E2E_PREFIX, nuevoRunId } from "./env";
import { ApiInventario, crearContextoApi, type Dispositivo, type TipoDispositivo } from "./api";
import { AltaDispositivoPage } from "./pages/AltaDispositivoPage";
import { LoginPage } from "./pages/LoginPage";
import { NuevaDevolucionPage } from "./pages/NuevaDevolucionPage";
import { NuevoMovimientoPage } from "./pages/NuevoMovimientoPage";
import { NuevoPrestamoPage } from "./pages/NuevoPrestamoPage";

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

interface Fixtures {
  login: LoginPage;
  altaPage: AltaDispositivoPage;
  prestamoPage: NuevoPrestamoPage;
  movimientoPage: NuevoMovimientoPage;
  devolucionPage: NuevaDevolucionPage;
  escenario: Escenario;
  departamento: { id: string; name: string };
}

interface WorkerFixtures {
  ctxApi: APIRequestContext;
  api: ApiInventario;
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
});

export { expect };
