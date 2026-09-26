import type { APIRequestContext } from "@playwright/test";
import { test, expect } from "./support/fixtures";
import { E2E, E2E_PREFIX, newRunId, route } from "./support/env";
import { createContextApi } from "./support/api";
import { ApiAccess, DEMO_SITE_CODE, type AccessSite } from "./support/accessApi";
import { field, goToRoute } from "./support/pages/components";

/**
 * Reporte de entradas/salidas por persona (`/access/report`).
 *
 * Lo que se prueba es la **pantalla**; el escenario se siembra por API. La web
 * ya NO envía `tz`: la API resuelve el corte del día con su TZ de empresa
 * (`ACCESS_REPORT_TIMEZONE` → env → `America/Mexico_City`), así que las
 * verificaciones cruzadas hacen la misma petición sin `tz` y con el MISMO día de
 * referencia.
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

const RUN = newRunId();
const TZ = "America/Mazatlan";
const USERNAME_WITH_EVENTS = "e2e_report_con";
const USERNAME_WITH_EVENTS_2 = "e2e_report_con2";
const USERNAME_WITHOUT_EVENTS = "e2e_report_sin";
const NAME_WITH_EVENTS = "E2E Reporte Con Eventos";
const NAME_WITH_EVENTS_2 = "E2E Reporte Con Eventos 2";
const NAME_WITHOUT_EVENTS = "E2E Reporte Sin Eventos";

/** Día de referencia local (el mismo que resuelve el navegador por defecto). */
const localToday = (): string =>
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
  let withEventsId = "";
  let withoutEventsId = "";

  test.beforeAll(async () => {
    ctx = await createContextApi();
    access = new ApiAccess(ctx);

    const sites = await access.sites();
    const demo = sites.find((s) => s.code === DEMO_SITE_CODE);
    if (!demo) {
      throw new Error(
        `No existe el sitio demo "${DEMO_SITE_CODE}"; corre "npm run test:e2e:provision" en ../api.`
      );
    }
    demoSite = demo;

    const withEvents = await access.ensureUser({
      username: USERNAME_WITH_EVENTS,
      name: NAME_WITH_EVENTS,
      role: "GUARD",
    });
    withEventsId = withEvents.id;

    const withoutEvents = await access.ensureUser({
      username: USERNAME_WITHOUT_EVENTS,
      name: NAME_WITHOUT_EVENTS,
      role: "EMPLOYEE",
    });
    withoutEventsId = withoutEvents.id;

    // ENTRY + EXIT de hoy (los eventos E2E se limpian en el teardown de `api/`,
    // así que el usuario arranca sin ventana anti-duplicado previa).
    await access.createEvent({
      employeeId: withEventsId,
      type: "ENTRY",
      siteId: demoSite.id,
      clientEventId: `${E2E_PREFIX}-${RUN}-RPT-000`,
    });
    await access.createEvent({
      employeeId: withEventsId,
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
    if (withoutEventsId) await access.deleteUser(withoutEventsId).catch(() => undefined);
    await ctx.dispose();
  });

  test("ADMIN ve KPIs y tabla, y la persona con eventos muestra sus horas", async ({ page }) => {
    await goToRoute(page, "/access/report");

    await expect(
      page.getByRole("heading", { level: 1, name: "Reporte de entradas y salidas" })
    ).toBeVisible();

    // KPIs (labels exactos; no confundir con los badges de la tabla).
    await expect(page.getByText("Personas con registros", { exact: true })).toBeVisible();
    await expect(page.getByText("Personas sin registros", { exact: true })).toBeVisible();
    await expect(page.getByText("Horas totales", { exact: true })).toBeVisible();

    const body = page.locator("table tbody");
    await field(page, "Buscar empleado").fill(NAME_WITH_EVENTS);
    await expect(body.getByText(NAME_WITH_EVENTS).first()).toBeVisible();

    // Verificación cruzada: la UI muestra las MISMAS horas que calcula la API.
    // La tabla lista SESIONES (una fila por entrada/salida), no personas.
    const rep = await access.report({
      filters: { period: "DAY", date: localToday(), q: NAME_WITH_EVENTS },
    });
    const row = rep.data.find((r) => r.employeeId === withEventsId);
    expect(row, "la API debe devolver la sesión de la persona sembrada").toBeTruthy();
    expect(rep.summary.peopleWithRecords).toBeGreaterThanOrEqual(1);
    await expect(body.getByText(formatMinutes(row!.workedMinutes)).first()).toBeVisible();
  });

  test("cambiar la granularidad (DÍA→SEMANA→MES) dispara la petición con el period correcto", async ({
    page,
  }) => {
    await goToRoute(page, "/access/report");
    await expect(page.locator("table tbody")).toBeVisible();

    const waitForReport = () =>
      page.waitForRequest(
        (r) => r.method() === "POST" && r.url().endsWith("/access/report")
      );

    const pWeek = waitForReport();
    await page.getByRole("button", { name: "Semanal" }).click();
    const reqWeek = await pWeek;
    expect(reqWeek.postDataJSON()).toMatchObject({ filters: { period: "WEEK" } });

    const pMonth = waitForReport();
    await page.getByRole("button", { name: "Mensual" }).click();
    const reqMonth = await pMonth;
    expect(reqMonth.postDataJSON()).toMatchObject({ filters: { period: "MONTH" } });

    // Re-renderizó: la tabla sigue mostrando la persona sembrada.
    const body = page.locator("table tbody");
    await field(page, "Buscar empleado").fill(NAME_WITH_EVENTS);
    await expect(body.getByText(NAME_WITH_EVENTS).first()).toBeVisible();
  });

  test("una persona sin eventos no genera fila y el reporte la cuenta sin registros", async ({
    page,
  }) => {
    await goToRoute(page, "/access/report");

    const body = page.locator("table tbody");
    await field(page, "Buscar empleado").fill(NAME_WITHOUT_EVENTS);
    // La tabla lista sesiones: sin eventos, la búsqueda no devuelve filas.
    await expect(body.getByText("No se encontraron resultados").first()).toBeVisible();

    // Verificación cruzada: la API la incluye en el universo del periodo pero
    // sin registros (la cuenta vive en el resumen, no como fila de la tabla).
    const rep = await access.report({
      filters: { period: "DAY", date: localToday(), q: NAME_WITHOUT_EVENTS },
    });
    expect(rep.summary.peopleTotal).toBe(1);
    expect(rep.summary.peopleWithRecords).toBe(0);
    expect(rep.summary.peopleWithoutRecords).toBe(1);
    expect(rep.data).toHaveLength(0);
  });

  test("la tabla ordena por entryAt desc por defecto", async ({ page }) => {
    const firstReport = page.waitForRequest(
      (r) => r.method() === "POST" && r.url().endsWith("/access/report")
    );

    await goToRoute(page, "/access/report");

    const body = (await firstReport).postDataJSON() as {
      sort?: { key: string; direction: string };
    };
    expect(body.sort).toEqual({ key: "entryAt", direction: "desc" });
  });

  test("el export respeta el orden de la tabla (paridad al ordenar por Empleado)", async ({
    page,
  }) => {
    await goToRoute(page, "/access/report");
    await expect(page.locator("table tbody")).toBeVisible();

    // Primer click en el encabezado sortable → `asc`. La petición de tabla con
    // ese sort confirma que el hook ya lo guardó como orden vigente.
    const reordered = page.waitForRequest((r) => {
      if (r.method() !== "POST" || !r.url().endsWith("/access/report")) return false;
      const data = r.postDataJSON() as { sort?: { key?: string } };
      return data?.sort?.key === "employeeName";
    });
    await page.getByTitle("Ordenar por Empleado").click();
    expect((await reordered).postDataJSON()).toMatchObject({
      sort: { key: "employeeName", direction: "asc" },
    });

    // El export comparte el sort vigente de la tabla.
    const exportRequest = page.waitForRequest(
      (r) => r.method() === "POST" && r.url().endsWith("/access/report/export")
    );
    await page.getByRole("button", { name: "CSV" }).click();
    expect((await exportRequest).postDataJSON()).toMatchObject({
      sort: { key: "employeeName", direction: "asc" },
    });
  });

  test("el export CSV trae las sesiones de la más reciente a la más vieja", async ({ page }) => {
    // Segunda sesión (usuario aparte): dos `entryAt` distintos en el mismo día.
    const second = await access.ensureUser({
      username: USERNAME_WITH_EVENTS_2,
      name: NAME_WITH_EVENTS_2,
      role: "GUARD",
    });
    await access.createEvent({
      employeeId: second.id,
      type: "ENTRY",
      siteId: demoSite.id,
      clientEventId: `${E2E_PREFIX}-${RUN}-RPT-002`,
    });
    await access.createEvent({
      employeeId: second.id,
      type: "EXIT",
      siteId: demoSite.id,
      clientEventId: `${E2E_PREFIX}-${RUN}-RPT-003`,
    });

    await goToRoute(page, "/access/report");
    await expect(page.locator("table tbody")).toBeVisible();

    const exportResponse = page.waitForResponse(
      (r) => r.request().method() === "POST" && r.url().endsWith("/access/report/export")
    );
    await page.getByRole("button", { name: "CSV" }).click();
    const body = (await (await exportResponse).json()) as {
      data: { entryAt: string | null }[];
    };

    const entryAts = body.data
      .map((r) => r.entryAt)
      .filter((x): x is string => x !== null);
    expect(entryAts.length).toBeGreaterThanOrEqual(2);
    // ISO-8601 ordena lexicográficamente = cronológicamente.
    expect(entryAts).toEqual([...entryAts].sort().reverse());
  });

  test("el subitem de menú 'Reporte entradas/salidas' es visible para ADMIN", async ({ page }) => {
    await goToRoute(page, "/access/report");

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

  for (const username of [E2E.employee.username, E2E.guard.username]) {
    test(`un rol no autorizado (${username}) no accede al reporte`, async ({ page, login }) => {
      await login.enterAs(username);

      await page.goto(route("/access/report"));

      await expect(page).not.toHaveURL(/#\/access\/report/);
      await expect(page.getByText("Reporte de entradas y salidas")).toHaveCount(0);
    });
  }
});
