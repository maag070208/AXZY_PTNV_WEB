import type { APIRequestContext } from "@playwright/test";
import { test, expect } from "./support/fixtures";
import { E2E, E2E_PREFIX, nuevoRunId, ruta } from "./support/env";
import { crearContextoApi } from "./support/api";
import { ApiAccess, DEMO_SITE_CODE, qrDe, type AccessSite } from "./support/accessApi";
import { campo, irARuta } from "./support/pages/componentes";

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

const RUN = nuevoRunId();
const EMPLEADO = E2E.empleado.name;
const SUJETOS = [E2E.empleado.username, E2E.guard.username, E2E.admin.username];
// Marcador estable (no depende de RUN) para que un reinicio de worker tras un
// fallo no vuelva a sembrar. La limpieza del paquete `api/` lo borra por el
// prefijo `E2E` al provisionar y al terminar.
const SITIO_VACIO_CODE = "E2E-WEB-ACCESS-EMPTY";

test.describe("Bitácora de accesos", () => {
  let ctx: APIRequestContext;
  let access: ApiAccess;
  let demoSite: AccessSite;

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

    // El sitio vacío es el marcador de "ya sembrado" de esta corrida: sirve
    // para el filtro por sitio y para no duplicar eventos si el hook se repite.
    if (sitios.some((s) => s.code === SITIO_VACIO_CODE)) return;
    await access.crearSitio({ name: "E2E Web Vacío", code: SITIO_VACIO_CODE });

    // 2 eventos por usuario (ENTRY + EXIT, sin repetir tipo). El primer tipo es
    // el opuesto al último evento del usuario para respetar la secuencia.
    let secuencia = 0;
    for (const username of SUJETOS) {
      const employeeId = await access.usuarioPorUsername(username);
      const estado = await access.estado(employeeId);
      const primero: "ENTRY" | "EXIT" = estado.hasOpenEntry ? "EXIT" : "ENTRY";
      const segundo: "ENTRY" | "EXIT" = primero === "ENTRY" ? "EXIT" : "ENTRY";

      for (const type of [primero, segundo]) {
        const id = String(secuencia).padStart(3, "0");
        secuencia += 1;
        await access.crearEvento({
          qr: qrDe(employeeId),
          type,
          siteId: demoSite.id,
          clientEventId: `${E2E_PREFIX}-${RUN}-${id}`,
          ...(id === "000" ? { latitude: 19.4326, longitude: -99.1332, accuracy: 8.5 } : {}),
        });
      }
    }
  });

  test.afterAll(async () => {
    await ctx.dispose();
  });

  test("renderiza la tabla con empleado, tipo, sitio y fuente de ubicación", async ({
    page,
  }) => {
    await irARuta(page, "/access");

    const cuerpo = page.locator("table tbody");
    await expect(
      page.getByRole("heading", { level: 1, name: "Bitácora de accesos" })
    ).toBeVisible();
    await expect(cuerpo.getByText(EMPLEADO).first()).toBeVisible();
    await expect(cuerpo.getByText("Entrada").first()).toBeVisible();
    await expect(cuerpo.getByText(demoSite.name).first()).toBeVisible();
    await expect(cuerpo.getByText("GPS").first()).toBeVisible();
    await expect(cuerpo.getByText("Activo").first()).toBeVisible();
  });

  test("filtra por empleado en el servidor y muestra el vacío cuando no hay coincidencias", async ({
    page,
  }) => {
    await irARuta(page, "/access");
    const cuerpo = page.locator("table tbody");
    await expect(cuerpo.getByText(EMPLEADO).first()).toBeVisible();

    await campo(page, "Buscar empleado").fill(EMPLEADO);
    await expect(cuerpo.getByText(EMPLEADO).first()).toBeVisible();
    await expect(cuerpo.getByText(E2E.guard.name)).toHaveCount(0);

    // La misma consulta contra la API confirma que el filtro es del backend.
    const coincidentes = await access.query({ limit: 100, filters: { q: EMPLEADO } });
    expect(coincidentes.total).toBeGreaterThanOrEqual(2);
    expect(coincidentes.data.every((e) => e.employeeNameSnapshot === EMPLEADO)).toBe(true);

    await campo(page, "Buscar empleado").fill(`SIN-COINCIDENCIA-${RUN}`);
    await expect(cuerpo.getByText("No se encontraron resultados").first()).toBeVisible();
  });

  test("filtra por tipo en el servidor", async ({ page }) => {
    await irARuta(page, "/access");
    const cuerpo = page.locator("table tbody");
    await expect(cuerpo.getByText("Entrada").first()).toBeVisible();

    await page.locator('select[name="filter-type"]').selectOption("EXIT");

    await expect(cuerpo.getByText("Salida").first()).toBeVisible();
    await expect(cuerpo.getByText("Entrada")).toHaveCount(0);

    const salidas = await access.query({ limit: 100, filters: { type: "EXIT" } });
    expect(salidas.data.every((e) => e.type === "EXIT")).toBe(true);
  });

  test("filtra por sitio en el servidor", async ({ page }) => {
    await irARuta(page, "/access");
    const cuerpo = page.locator("table tbody");

    const sitios = await access.sitios();
    const vacio = sitios.find((s) => s.code === SITIO_VACIO_CODE);
    expect(vacio, "el sitio vacío debió crearse en beforeAll").toBeTruthy();

    await page.locator('select[name="filter-siteId"]').selectOption(vacio!.id);
    await expect(cuerpo.getByText("No se encontraron resultados").first()).toBeVisible();

    await page.locator('select[name="filter-siteId"]').selectOption(demoSite.id);
    await expect(cuerpo.getByText(EMPLEADO).first()).toBeVisible();
    await expect(cuerpo.getByText(demoSite.name).first()).toBeVisible();
  });

  test("pagina en el servidor", async ({ page }) => {
    await irARuta(page, "/access");
    const tabla = page.locator("table");

    // El término "E2E" agrupa a los tres sujetos: 6 eventos sembrados.
    await campo(page, "Buscar empleado").fill("E2E");
    await expect(tabla.locator("tbody").getByText(EMPLEADO).first()).toBeVisible();

    const totalE2E = (await access.query({ limit: 1, filters: { q: "E2E" } })).total;
    expect(totalE2E).toBeGreaterThan(5); // hay al menos dos páginas

    await page.locator('select[name="itemsPerPage"]').selectOption("5");
    await expect(tabla.locator("tbody tr")).toHaveCount(5);
    const primeraPagina = await tabla.locator("tbody tr").first().innerText();

    await page.locator('[title="Page 2"]').click();
    // Se espera al refetch: la segunda página trae el resto de los eventos.
    await expect(tabla.locator("tbody tr")).toHaveCount(Math.min(5, totalE2E - 5));
    expect(await tabla.locator("tbody tr").first().innerText()).not.toBe(primeraPagina);
  });

  test("anula un evento con motivo y lo refleja como anulado", async ({ page }) => {
    await irARuta(page, "/access");
    const cuerpo = page.locator("table tbody");
    await expect(cuerpo.getByText(EMPLEADO).first()).toBeVisible();

    // Los anulados se ocultan por defecto; se activa el filtro soportado.
    await page.getByText("Mostrar anulados").click();

    await page.getByTitle("Anular").first().click();
    await expect(page.getByText("Anular evento").first()).toBeVisible();

    await campo(page, "Motivo de anulación").fill("Motivo E2E");
    await page.getByRole("button", { name: "Anular evento" }).click();

    await expect(page.getByText("El evento fue anulado correctamente").first()).toBeVisible();
    await expect(cuerpo.getByText("Anulado").first()).toBeVisible();
  });
});

test.describe("Bitácora de accesos — gate por rol", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("un rol no autorizado no accede a la bitácora", async ({ page, login }) => {
    await login.entrarComo(E2E.empleado.username);

    await page.goto(ruta("/access"));

    await expect(page).not.toHaveURL(/#\/access/);
    await expect(page.getByText("Bitácora de accesos")).toHaveCount(0);
  });
});
