import type { APIRequestContext } from "@playwright/test";
import { test, expect } from "./support/fixtures";
import { E2E_PREFIX, nuevoRunId } from "./support/env";
import { crearContextoApi } from "./support/api";
import { ApiAccess, DEMO_SITE_CODE, type AccessSite } from "./support/accessApi";
import { campo, irARuta } from "./support/pages/componentes";

/**
 * Reporte de horas extra (`/horarios/horas-extra`) — exportación a PDF.
 *
 * Lo que se prueba es la **pantalla**; el escenario se siembra por API. El
 * reporte solo incluye a quien tiene al menos una checada en el periodo, así
 * que se siembra un usuario con ENTRY/EXIT de hoy (misma zona horaria del
 * navegador, `America/Mazatlan`, ver `playwright.config.ts`).
 *
 * El usuario con eventos se crea con rol `GUARD`: un rol ajeno al personal
 * aparece en el universo solo por tener eventos; tras la limpieza de eventos
 * (teardown de `api/`, por el prefijo `E2E-`) no contamina corridas futuras.
 *
 * El usuario es **idempotente**: se reutiliza por `username` en vez de crear uno
 * nuevo por corrida, así que no se acumulan cuentas `e2e_horas_extra_*` (ver el
 * inventario de residuos en `README.md`).
 */

const RUN = nuevoRunId();
const USERNAME = "e2e_horas_extra";
const NOMBRE = "E2E HorasExtra";

test.describe("Reporte de horas extra — exportación PDF", () => {
  let ctx: APIRequestContext;
  let access: ApiAccess;
  let demoSite: AccessSite;
  let usuarioId = "";

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

    const usuario = await access.asegurarUsuario({
      username: USERNAME,
      name: NOMBRE,
      role: "GUARD",
    });
    usuarioId = usuario.id;

    // ENTRY + EXIT de hoy (los eventos E2E se limpian en el teardown de `api/`,
    // así que el usuario arranca sin ventana anti-duplicado previa).
    await access.crearEvento({
      employeeId: usuarioId,
      type: "ENTRY",
      siteId: demoSite.id,
      clientEventId: `${E2E_PREFIX}-${RUN}-HE-000`,
    });
    await access.crearEvento({
      employeeId: usuarioId,
      type: "EXIT",
      siteId: demoSite.id,
      clientEventId: `${E2E_PREFIX}-${RUN}-HE-001`,
    });
  });

  test.afterAll(async () => {
    // El usuario tiene eventos ligados (FK Restrict): no se puede borrar; se
    // reutiliza por `username` en la próxima corrida. La limpieza de los eventos
    // E2E la hace el teardown del paquete `api/`.
    await ctx.dispose();
  });

  test("descarga el PDF con el nombre esperado cuando hay filas", async ({ page }) => {
    await irARuta(page, "/horarios/horas-extra");

    const botonPdf = page.getByRole("button", { name: "PDF" });
    const cuerpo = page.locator("table tbody");
    await campo(page, "Empleado").fill(NOMBRE);
    await expect(cuerpo.getByText(NOMBRE).first()).toBeVisible();

    await expect(botonPdf).toBeEnabled();
    const descarga = page.waitForEvent("download");
    await botonPdf.click();
    const download = await descarga;
    expect(download.suggestedFilename()).toMatch(
      /^reporte_horas_extra_(day|week|month)_\d{8}\.pdf$/
    );
  });

  test("el botón PDF queda deshabilitado cuando no hay filas", async ({ page }) => {
    await irARuta(page, "/horarios/horas-extra");

    const botonPdf = page.getByRole("button", { name: "PDF" });
    await campo(page, "Empleado").fill(NOMBRE);
    await expect(botonPdf).toBeEnabled();

    await campo(page, "Empleado").fill(`E2E Inexistente ${RUN}`);
    await expect(botonPdf).toBeDisabled();
  });

  test("el botón CSV sigue disponible con filas (no regresión)", async ({ page }) => {
    await irARuta(page, "/horarios/horas-extra");

    const botonCsv = page.getByRole("button", { name: "CSV" });
    await campo(page, "Empleado").fill(NOMBRE);
    await expect(page.locator("table tbody").getByText(NOMBRE).first()).toBeVisible();
    await expect(botonCsv).toBeEnabled();
  });
});
