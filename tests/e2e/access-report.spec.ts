import type { APIRequestContext, Page } from "@playwright/test";
import { test, expect } from "./support/fixtures";
import { E2E, E2E_PREFIX, newRunId, route } from "./support/env";
import { createContextApi } from "./support/api";
import { ApiAccess, DEMO_SITE_CODE, type AccessSite } from "./support/accessApi";
import { button, goToRoute } from "./support/pages/components";

/**
 * Reporte de entradas/salidas por persona (`/access/report`).
 *
 * La pantalla lista **personas**: una fila con cada día del periodo calificado
 * contra su horario (asistió, retardo, falta, descanso, sin horario), más sus
 * horas e incidencias. La petición es
 * `POST /schedules/attendance/access`; los exports siguen trayendo el detalle por
 * sesión (`POST /access/report/export`).
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
// Mismo huso que resuelve la API por defecto: así el día de referencia del
// navegador y el que calcula la API no se desfasan en el borde de la medianoche.
const TZ = "America/Mexico_City";
const USERNAME_WITH_EVENTS = "e2e_report_con";
const USERNAME_WITH_EVENTS_2 = "e2e_report_con2";
const USERNAME_WITHOUT_EVENTS = "e2e_report_sin";
const NAME_WITH_EVENTS = "E2E Reporte Con Eventos";
const NAME_WITH_EVENTS_2 = "E2E Reporte Con Eventos 2";
const NAME_WITHOUT_EVENTS = "E2E Reporte Sin Eventos";

/** El periodo por defecto de la pantalla: la semana que contiene hoy. */
const DEFAULT_PERIOD = "WEEK";

/** Día de referencia local (el mismo que resuelve el navegador por defecto). */
const localToday = (): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

/** `workedMinutes` → `h:mm`, igual que la pantalla (`workedTime`: sin cero a la izquierda). */
const formatMinutes = (minutes: number): string => {
  const total = Math.max(0, Math.round(minutes));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

/** Caja de búsqueda por nombre o número de empleado (sin etiqueta propia en la barra). */
const searchBox = (page: Page) => page.getByPlaceholder("Nombre o número de empleado");

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
    // pero se reutiliza por `username`; sin eventos tras la limpieza tampoco
    // acumula registros.
    if (withoutEventsId) await access.deleteUser(withoutEventsId).catch(() => undefined);
    await ctx.dispose();
  });

  test("ADMIN ve KPIs y la persona con eventos muestra sus horas", async ({ page }) => {
    await goToRoute(page, "/access/report");

    await expect(
      page.getByRole("heading", { level: 1, name: "Reporte de entradas y salidas" })
    ).toBeVisible();

    // KPIs (labels exactos; "Sin registros" también es una vista y un estado de la tabla).
    await expect(page.getByText("En sitio ahora", { exact: true })).toBeVisible();
    await expect(page.getByText("Con registros", { exact: true })).toBeVisible();
    await expect(page.getByText("Sin registros", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Horas totales", { exact: true })).toBeVisible();
    await expect(page.getByText("Incidencias", { exact: true })).toBeVisible();

    const body = page.locator("table tbody");
    await searchBox(page).fill(NAME_WITH_EVENTS);
    await expect(body.getByText(NAME_WITH_EVENTS).first()).toBeVisible();

    // Verificación cruzada: la tabla lista PERSONAS (una fila con cada día del
    // periodo) y sus horas totales son las que calcula la API.
    const rep = await access.people({
      filters: { period: DEFAULT_PERIOD, date: localToday(), q: NAME_WITH_EVENTS },
    });
    const row = rep.data.find((r) => r.employeeId === withEventsId);
    expect(row, "la API debe devolver la persona sembrada").toBeTruthy();
    expect(row!.hasRecords).toBe(true);
    expect(rep.summary.withRecords).toBeGreaterThanOrEqual(1);
    await expect(body.getByText(formatMinutes(row!.workedMinutes)).first()).toBeVisible();
  });

  test("cambiar la granularidad (QUINCENA→MES→SEMANA) dispara la petición con el period correcto", async ({
    page,
  }) => {
    await goToRoute(page, "/access/report");
    await expect(page.locator("table tbody")).toBeVisible();

    // La petición de la tabla es la del reporte por persona (no la de export).
    const waitForPeriod = (period: "WEEK" | "FORTNIGHT" | "MONTH") =>
      page.waitForRequest((r) => {
        if (r.method() !== "POST" || !r.url().endsWith("/schedules/attendance/access")) return false;
        const body = r.postDataJSON() as { filters?: { period?: string } } | null;
        return body?.filters?.period === period;
      });

    // La semana es el periodo por defecto: se parte de ella para que cada
    // selección sea un cambio real (y dispare su petición).
    const pFortnight = waitForPeriod("FORTNIGHT");
    await button(page, "Quincenal").click();
    const reqFortnight = await pFortnight;
    expect(reqFortnight.postDataJSON()).toMatchObject({ filters: { period: "FORTNIGHT" } });

    const pMonth = waitForPeriod("MONTH");
    await button(page, "Mensual").click();
    const reqMonth = await pMonth;
    expect(reqMonth.postDataJSON()).toMatchObject({ filters: { period: "MONTH" } });

    const pWeek = waitForPeriod("WEEK");
    await button(page, "Semanal").click();
    const reqWeek = await pWeek;
    expect(reqWeek.postDataJSON()).toMatchObject({ filters: { period: "WEEK" } });

    // Re-renderizó: la tabla sigue mostrando la persona sembrada.
    const body = page.locator("table tbody");
    await searchBox(page).fill(NAME_WITH_EVENTS);
    await expect(body.getByText(NAME_WITH_EVENTS).first()).toBeVisible();
  });

  test("una persona sin eventos aparece sin registros y las vistas la aíslan", async ({ page }) => {
    await goToRoute(page, "/access/report");

    const body = page.locator("table tbody");
    await searchBox(page).fill(NAME_WITHOUT_EVENTS);
    // El universo incluye a quien no tiene actividad: sale como fila sin registros.
    await expect(body.getByText(NAME_WITHOUT_EVENTS).first()).toBeVisible();

    // Verificación cruzada: la API la cuenta sin registros.
    const rep = await access.people({
      filters: { period: DEFAULT_PERIOD, date: localToday(), q: NAME_WITHOUT_EVENTS },
    });
    const row = rep.data.find((r) => r.employeeId === withoutEventsId);
    expect(row, "la API debe devolver a la persona sin eventos").toBeTruthy();
    expect(row!.hasRecords).toBe(false);
    expect(rep.summary.withoutRecords).toBe(1);

    // Vista "Sin registros" (chip de la tabla; el KPI homónimo no es exacto): sigue visible.
    await button(page, /^Sin registros$/).click();
    await expect(body.getByText(NAME_WITHOUT_EVENTS).first()).toBeVisible();

    // Vista "En sitio": no está en sitio, la tabla queda vacía.
    await button(page, /^En sitio$/).click();
    await expect(body.getByText("No se encontraron resultados").first()).toBeVisible();
  });

  test("la primera petición trae el periodo vigente y no ordena por sesión", async ({ page }) => {
    const firstReport = page.waitForRequest(
      (r) => r.method() === "POST" && r.url().endsWith("/schedules/attendance/access")
    );

    await goToRoute(page, "/access/report");

    const body = (await firstReport).postDataJSON() as {
      page?: number;
      filters?: Record<string, unknown>;
      sort?: { key?: string };
    };
    expect(body.page).toBe(1);
    expect(body.filters).toMatchObject({ period: DEFAULT_PERIOD, includeInactive: false });
    expect(body.filters?.date).toBe(localToday());
    // La tabla no arranca ordenada por la sesión: la pantalla ya no lista sesiones.
    expect(body.sort?.key).not.toBe("entryAt");
  });

  test("el export comparte los filtros vigentes de la tabla", async ({ page }) => {
    await goToRoute(page, "/access/report");
    await expect(page.locator("table tbody")).toBeVisible();

    // Al filtrar, la tabla pide con ese filtro (el reporte lista personas y sus
    // columnas de día no son ordenables; lo que el export debe respetar son los
    // filtros de la barra).
    const filtered = page.waitForRequest((r) => {
      if (r.method() !== "POST" || !r.url().endsWith("/schedules/attendance/access")) return false;
      const data = r.postDataJSON() as { filters?: { q?: string } };
      return data?.filters?.q === NAME_WITH_EVENTS;
    });
    await searchBox(page).fill(NAME_WITH_EVENTS);
    await filtered;

    // El export comparte los filtros vigentes de la tabla.
    const exportRequest = page.waitForRequest(
      (r) => r.method() === "POST" && r.url().endsWith("/access/report/export")
    );
    await page.getByRole("button", { name: "CSV" }).click();
    expect((await exportRequest).postDataJSON()).toMatchObject({
      filters: { q: NAME_WITH_EVENTS },
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

  test("el subitem de menú 'Entrada/salida' (del guardia) es visible para ADMIN", async ({ page }) => {
    await goToRoute(page, "/access/report");

    // La barra lateral arranca colapsada; al pasar el mouse se expande y el
    // padre (auto-expandido por el subitem activo) muestra sus hijos.
    await page.locator("aside").hover();
    await expect(page.getByText("Guardia", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Entrada/salida", { exact: true }).first()).toBeVisible();
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
