import type { APIRequestContext } from "@playwright/test";
import { test, expect } from "./support/fixtures";
import { E2E, E2E_PREFIX, newRunId, route } from "./support/env";
import { createContextApi } from "./support/api";
import {
  ApiAccess,
  DEMO_SITE_CODE,
  qrDe,
  type AccessSite,
} from "./support/accessApi";
import { field, goToRoute } from "./support/pages/components";

/**
 * Bitácora de accesos (`/access`), server-side.
 *
 * Lo que se prueba es la **pantalla**; el escenario se siembra por API. La API
 * rechaza dos eventos del mismo tipo para el mismo empleado dentro de una
 * ventana anti-duplicado (60s por defecto), así que se reparten ENTRY+EXIT
 * entre los usuarios ya provisionados (`e2e_empleado`, `e2e_guard`,
 * `e2e_admin`) en vez de crear empleados de prueba: 6 eventos deterministas
 * sin tocar la configuración global. Todos llevan `clientEventId` con prefijo
 * `E2E-`, que es lo que limpia el teardown del paquete `api/`.
 *
 * El sembrado se marca con un sitio de código fijo: si `beforeAll` se vuelve a
 * ejecutar (Playwright reinicia el worker tras un fallo), no duplica eventos.
 * Las aserciones se acotan al `tbody` para no chocar con las opciones de los
 * filtros del encabezado, que también viven dentro de la `<table>`.
 */

const RUN = newRunId();
const EMPLOYEE = E2E.employee.name;
// Marcador estable (no depende de RUN) para que un reinicio de worker tras un
// fallo no vuelva a sembrar. La limpieza del paquete `api/` lo borra por el
// prefijo `E2E` al provisionar y al terminar.
const EMPTY_SITE_CODE = "E2E-WEB-ACCESS-EMPTY";
// Usuarios de relleno para que la tabla supere una página de 10 renglones y se
// pueda ejercitar la paginación server-side sin depender del volumen real del
// cliente. Rol ajeno al personal (GUARD): sin eventos tras la limpieza no
// reaparece en el universo del reporte. Usernames fijos → no se acumulan.
const PADDING = [1, 2, 3];

test.describe("Bitácora de accesos", () => {
  let ctx: APIRequestContext;
  let access: ApiAccess;
  let demoSite: AccessSite;

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

    // El sitio vacío es el marcador de "ya sembrado" de esta corrida: sirve
    // para el filtro por sitio y para no duplicar eventos si el hook se repite.
    if (sites.some((s) => s.code === EMPTY_SITE_CODE)) return;
    await access.createSite({ name: "E2E Web Vacío", code: EMPTY_SITE_CODE });

    // Los rellenos se siembran primero y `e2e_empleado` al final, para que sus
    // eventos queden arriba del orden `occurredAt desc` y aparezcan en la
    // primera página de la tabla (10 renglones).
    const usernames: string[] = [];
    for (const n of PADDING) {
      const padding = await access.ensureUser({
        username: `e2e_bitacora_relleno_${n}`,
        name: `E2E Bitácora Relleno ${n}`,
        role: "GUARD",
      });
      usernames.push(padding.username);
    }
    usernames.push(E2E.guard.username, E2E.admin.username, E2E.employee.username);

    // 2 eventos por usuario (ENTRY + EXIT, sin repetir tipo). El primer tipo es
    // el opuesto al último evento del usuario para respetar la secuencia. El
    // primer evento de `e2e_empleado` lleva GPS: es el que el detalle verifica.
    let sequence = 0;
    for (const username of usernames) {
      const employeeId = await access.userByUsername(username);
      const status = await access.status(employeeId);
      const first: "ENTRY" | "EXIT" = status.hasOpenEntry ? "EXIT" : "ENTRY";
      const second: "ENTRY" | "EXIT" = first === "ENTRY" ? "EXIT" : "ENTRY";

      let isFirst = true;
      for (const type of [first, second]) {
        const id = String(sequence).padStart(3, "0");
        sequence += 1;
        const withGps = username === E2E.employee.username && isFirst;
        await access.createEvent({
          qr: qrDe(employeeId),
          type,
          siteId: demoSite.id,
          clientEventId: `${E2E_PREFIX}-${RUN}-${id}`,
          ...(withGps ? { latitude: 19.4326, longitude: -99.1332, accuracy: 8.5 } : {}),
        });
        isFirst = false;
      }
    }
  });

  test.afterAll(async () => {
    await ctx.dispose();
  });

  test("renderiza la tabla con empleado, tipo, sitio y fuente de ubicación", async ({
    page,
  }) => {
    await goToRoute(page, "/access");
    // El rango por defecto es "hoy" (TZ del navegador); se amplía a 7 días para
    // que "ahora" quede dentro aunque la fecha del navegador y la de la API
    // difieran en el borde del día (ver ticket de producto en el README).
    await page.getByRole("button", { name: "7 días" }).click();

    const body = page.locator("table tbody");
    await expect(
      page.getByRole("heading", { level: 1, name: "Bitácora de accesos" })
    ).toBeVisible();
    await field(page, "Buscar empleado").fill(EMPLOYEE);
    await expect(body.getByText(EMPLOYEE).first()).toBeVisible();
    await expect(body.getByText("Entrada").first()).toBeVisible();
    await expect(body.getByText(demoSite.name).first()).toBeVisible();

    // `Fuente de ubicación` y `Estado` viven en el diálogo de detalle (no son
    // columnas): se abre el evento sembrado CON GPS y se verifican ahí.
    const events = (await access.query({ limit: 100, filters: { q: EMPLOYEE } })).data;
    const withGps = events.find((e) => e.locationSource === "GPS");
    expect(withGps, "el escenario sembró un evento con GPS").toBeTruthy();
    const typeGps = withGps!.type === "ENTRY" ? "Entrada" : "Salida";
    await body
      .locator("tr")
      .filter({ hasText: typeGps })
      .getByTitle("Ver detalle")
      .click();
    await expect(page.getByText("GPS").first()).toBeVisible();
    await expect(page.getByText("Activo").first()).toBeVisible();
  });

  test("filtra por empleado en el servidor y muestra el vacío cuando no hay coincidencias", async ({
    page,
  }) => {
    await goToRoute(page, "/access");
    const body = page.locator("table tbody");
    await expect(body.getByText(EMPLOYEE).first()).toBeVisible();

    await field(page, "Buscar empleado").fill(EMPLOYEE);
    await expect(body.getByText(EMPLOYEE).first()).toBeVisible();
    await expect(body.getByText(E2E.guard.name)).toHaveCount(0);

    // La misma consulta contra la API confirma que el filtro es del backend.
    const matching = await access.query({ limit: 100, filters: { q: EMPLOYEE } });
    expect(matching.total).toBeGreaterThanOrEqual(2);
    expect(matching.data.every((e) => e.employeeNameSnapshot === EMPLOYEE)).toBe(true);

    await field(page, "Buscar empleado").fill(`SIN-COINCIDENCIA-${RUN}`);
    await expect(body.getByText("No se encontraron resultados").first()).toBeVisible();
  });

  test("filtra por tipo en el servidor", async ({ page }) => {
    await goToRoute(page, "/access");
    const body = page.locator("table tbody");
    await expect(body.getByText("Entrada").first()).toBeVisible();

    await page.locator('select[name="filter-type"]').selectOption("EXIT");

    await expect(body.getByText("Salida").first()).toBeVisible();
    await expect(body.getByText("Entrada")).toHaveCount(0);

    const exits = await access.query({ limit: 100, filters: { type: "EXIT" } });
    expect(exits.data.every((e) => e.type === "EXIT")).toBe(true);
  });

  test("filtra por sitio en el servidor", async ({ page }) => {
    await goToRoute(page, "/access");
    const body = page.locator("table tbody");

    const sites = await access.sites();
    const empty = sites.find((s) => s.code === EMPTY_SITE_CODE);
    expect(empty, "el sitio vacío debió crearse en beforeAll").toBeTruthy();

    await page.locator('select[name="filter-siteId"]').selectOption(empty!.id);
    await expect(body.getByText("No se encontraron resultados").first()).toBeVisible();

    await page.locator('select[name="filter-siteId"]').selectOption(demoSite.id);
    await expect(body.getByText(EMPLOYEE).first()).toBeVisible();
    await expect(body.getByText(demoSite.name).first()).toBeVisible();
  });

  test("pagina en el servidor", async ({ page }) => {
    await goToRoute(page, "/access");
    const table = page.locator("table");

    // El término "E2E" agrupa a los usuarios sembrados: más de una página.
    await field(page, "Buscar empleado").fill("E2E");
    await expect(table.locator("tbody").getByText(EMPLOYEE).first()).toBeVisible();

    const totalE2E = (await access.query({ limit: 1, filters: { q: "E2E" } })).total;
    expect(totalE2E).toBeGreaterThan(10); // hay al menos dos páginas

    // La tabla arranca con 10 renglones por página.
    await expect(table.locator("tbody tr")).toHaveCount(10);
    const firstPage = await table.locator("tbody tr").first().innerText();

    await page.locator('[title="Page 2"]').click();
    // Se espera al refetch: la segunda página trae el resto de los eventos.
    await expect(table.locator("tbody tr")).toHaveCount(Math.min(10, totalE2E - 10));
    expect(await table.locator("tbody tr").first().innerText()).not.toBe(firstPage);
  });

  test("anula un evento con motivo y lo refleja como anulado", async ({ page }) => {
    await goToRoute(page, "/access");
    const body = page.locator("table tbody");
    await field(page, "Buscar empleado").fill(EMPLOYEE);
    await expect(body.getByText(EMPLOYEE).first()).toBeVisible();

    // Los anulados se ocultan por defecto; se activa el filtro soportado.
    await page.getByText("Mostrar anulados").click();

    // El disparador "Anular" vive en el diálogo de detalle del evento (la tabla
    // ya no tiene columna de acciones de anulación).
    await body.getByTitle("Ver detalle").first().click();
    await page.getByRole("button", { name: "Anular", exact: true }).click();
    await expect(page.getByText("Anular evento").first()).toBeVisible();

    await field(page, "Motivo de anulación").fill("Motivo E2E");
    await page.getByRole("button", { name: "Anular evento" }).click();

    await expect(page.getByText("El evento fue anulado correctamente").first()).toBeVisible();

    // El evento queda anulado: se verifica en su diálogo de detalle (la tabla
    // tampoco tiene columna de estado).
    await body.getByTitle("Ver detalle").first().click();
    await expect(page.getByText("Anulado").first()).toBeVisible();
  });
});

test.describe("Bitácora de accesos — gate por rol", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("un rol no autorizado no accede a la bitácora", async ({ page, login }) => {
    await login.enterAs(E2E.employee.username);

    await page.goto(route("/access"));

    await expect(page).not.toHaveURL(/#\/access/);
    await expect(page.getByText("Bitácora de accesos")).toHaveCount(0);
  });
});
