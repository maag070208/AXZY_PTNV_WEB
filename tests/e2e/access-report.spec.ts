import type { APIRequestContext } from "@playwright/test";
import { test, expect } from "./support/fixtures";
import { E2E, E2E_PREFIX, nuevoRunId, ruta } from "./support/env";
import { crearContextoApi } from "./support/api";
import { ApiAccess, DEMO_SITE_CODE, type AccessSite } from "./support/accessApi";
import { campo, irARuta } from "./support/pages/componentes";

/**
 * Reporte de entradas/salidas por persona (`/access/report`).
 *
 * Lo que se prueba es la **pantalla**; el escenario se siembra por API. El
 * reporte se resuelve con la zona horaria del navegador, que Playwright fija en
 * `America/Mazatlan` (ver `playwright.config.ts`), así que las verificaciones
 * cruzadas usan la MISMA zona y el MISMO día de referencia.
 *
 * Los eventos se crean con `clientEventId` prefijado `E2E-` (lo que limpia el
 * teardown del paquete `api/`). El usuario con eventos se crea con rol `GUARD`:
 * un rol ajeno al personal aparece en el universo solo por tener eventos, así
 * que tras la limpieza no contamina corridas futuras.
 *
 * Los usuarios son **idempotentes**: se reutilizan por `username` en vez de
 * crear uno nuevo por corrida, así que no se acumulan cuentas `e2e_report_*`
 * (ver el inventario de residuos en `README.md`).
 */

const RUN = nuevoRunId();
const TZ = "America/Mazatlan";
const USERNAME_CON_EVENTOS = "e2e_report_con";
const USERNAME_SIN_EVENTOS = "e2e_report_sin";
const NOMBRE_CON_EVENTOS = "E2E Reporte Con Eventos";
const NOMBRE_SIN_EVENTOS = "E2E Reporte Sin Eventos";

/** Día de referencia local (el mismo que resuelve el navegador por defecto). */
const hoyLocal = (): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

/** `workedMinutes` → `hh:mm`, igual que la pantalla. */
const formatMinutes = (minutes: number): string => {
  const total = Math.max(0, Math.round(minutes));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

test.describe("Reporte de entradas/salidas", () => {
  let ctx: APIRequestContext;
  let access: ApiAccess;
  let demoSite: AccessSite;
  let conEventosId = "";
  let sinEventosId = "";

  test.beforeAll(async () => {
    ctx = await crearContextoApi();
    access = new ApiAccess(ctx);

    const sitios = await access.sitios();
    const demo = sitios.find((s) => s.code === DEMO_SITE_CODE);
    if (!demo) {
      throw new Error(
        `No existe el sitio demo "${DEMO_SITE_CODE}"; corre "npm run test:e2e:provision" en ../api.`
      );
    }
    demoSite = demo;

    const conEventos = await access.asegurarUsuario({
      username: USERNAME_CON_EVENTOS,
      name: NOMBRE_CON_EVENTOS,
      role: "GUARD",
    });
    conEventosId = conEventos.id;

    const sinEventos = await access.asegurarUsuario({
      username: USERNAME_SIN_EVENTOS,
      name: NOMBRE_SIN_EVENTOS,
      role: "EMPLEADO",
    });
    sinEventosId = sinEventos.id;

    // ENTRY + EXIT de hoy (los eventos E2E se limpian en el teardown de `api/`,
    // así que el usuario arranca sin ventana anti-duplicado previa).
    await access.crearEvento({
      employeeId: conEventosId,
      type: "ENTRY",
      siteId: demoSite.id,
      clientEventId: `${E2E_PREFIX}-${RUN}-RPT-000`,
    });
    await access.crearEvento({
      employeeId: conEventosId,
      type: "EXIT",
      siteId: demoSite.id,
      clientEventId: `${E2E_PREFIX}-${RUN}-RPT-001`,
    });
  });

  test.afterAll(async () => {
    // El usuario sin eventos no tiene historial ligado: se borra y la próxima
    // corrida lo vuelve a asegurar. El usuario con eventos queda (FK Restrict),
    // pero se reutiliza por `username`; sin eventos tras la limpieza no vuelve a
    // aparecer en el universo del reporte ni se acumula.
    if (sinEventosId) await access.eliminarUsuario(sinEventosId).catch(() => undefined);
    await ctx.dispose();
  });

  test("ADMIN ve KPIs y tabla, y la persona con eventos muestra sus horas", async ({ page }) => {
    await irARuta(page, "/access/report");

    await expect(
      page.getByRole("heading", { level: 1, name: "Reporte de entradas y salidas" })
    ).toBeVisible();

    // KPIs (labels exactos; no confundir con los badges de la tabla).
    await expect(page.getByText("Personas con registros", { exact: true })).toBeVisible();
    await expect(page.getByText("Personas sin registros", { exact: true })).toBeVisible();
    await expect(page.getByText("Horas totales", { exact: true })).toBeVisible();

    const cuerpo = page.locator("table tbody");
    await campo(page, "Buscar empleado").fill(NOMBRE_CON_EVENTOS);
    await expect(cuerpo.getByText(NOMBRE_CON_EVENTOS).first()).toBeVisible();

    // Verificación cruzada: la UI muestra las MISMAS horas que calcula la API.
    // La tabla lista SESIONES (una fila por entrada/salida), no personas.
    const rep = await access.report({
      filters: { period: "DAY", date: hoyLocal(), tz: TZ, q: NOMBRE_CON_EVENTOS },
    });
    const fila = rep.data.find((r) => r.employeeId === conEventosId);
    expect(fila, "la API debe devolver la sesión de la persona sembrada").toBeTruthy();
    expect(rep.summary.peopleWithRecords).toBeGreaterThanOrEqual(1);
    await expect(cuerpo.getByText(formatMinutes(fila!.workedMinutes)).first()).toBeVisible();
  });

  test("cambiar la granularidad (DÍA→SEMANA→MES) dispara la petición con el period correcto", async ({
    page,
  }) => {
    await irARuta(page, "/access/report");
    await expect(page.locator("table tbody")).toBeVisible();

    const esperarReporte = () =>
      page.waitForRequest(
        (r) => r.method() === "POST" && r.url().endsWith("/access/report")
      );

    const pSemana = esperarReporte();
    await page.getByRole("button", { name: "Semanal" }).click();
    const reqSemana = await pSemana;
    expect(reqSemana.postDataJSON()).toMatchObject({ filters: { period: "WEEK" } });

    const pMes = esperarReporte();
    await page.getByRole("button", { name: "Mensual" }).click();
    const reqMes = await pMes;
    expect(reqMes.postDataJSON()).toMatchObject({ filters: { period: "MONTH" } });

    // Re-renderizó: la tabla sigue mostrando la persona sembrada.
    const cuerpo = page.locator("table tbody");
    await campo(page, "Buscar empleado").fill(NOMBRE_CON_EVENTOS);
    await expect(cuerpo.getByText(NOMBRE_CON_EVENTOS).first()).toBeVisible();
  });

  test("una persona sin eventos no genera fila y el reporte la cuenta sin registros", async ({
    page,
  }) => {
    await irARuta(page, "/access/report");

    const cuerpo = page.locator("table tbody");
    await campo(page, "Buscar empleado").fill(NOMBRE_SIN_EVENTOS);
    // La tabla lista sesiones: sin eventos, la búsqueda no devuelve filas.
    await expect(cuerpo.getByText("No se encontraron resultados").first()).toBeVisible();

    // Verificación cruzada: la API la incluye en el universo del periodo pero
    // sin registros (la cuenta vive en el resumen, no como fila de la tabla).
    const rep = await access.report({
      filters: { period: "DAY", date: hoyLocal(), tz: TZ, q: NOMBRE_SIN_EVENTOS },
    });
    expect(rep.summary.peopleTotal).toBe(1);
    expect(rep.summary.peopleWithRecords).toBe(0);
    expect(rep.summary.peopleWithoutRecords).toBe(1);
    expect(rep.data).toHaveLength(0);
  });

  test("el subitem de menú 'Reporte entradas/salidas' es visible para ADMIN", async ({ page }) => {
    await irARuta(page, "/access/report");

    // La barra lateral arranca colapsada; al pasar el mouse se expande y el
    // padre (auto-expandido por el subitem activo) muestra sus hijos.
    await page.locator("aside").hover();
    await expect(
      page.getByText("Reporte entradas/salidas", { exact: true }).first()
    ).toBeVisible();
  });
});

test.describe("Reporte de entradas/salidas — gate por rol", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const username of [E2E.empleado.username, E2E.guard.username]) {
    test(`un rol no autorizado (${username}) no accede al reporte`, async ({ page, login }) => {
      await login.entrarComo(username);

      await page.goto(ruta("/access/report"));

      await expect(page).not.toHaveURL(/#\/access\/report/);
      await expect(page.getByText("Reporte de entradas y salidas")).toHaveCount(0);
    });
  }
});
