import { test, expect } from "./support/fixtures";
import type { Browser } from "@playwright/test";
import { E2E, nuevoRunId } from "./support/env";
import { limpiarOvertime, sembrarOvertime, type OvertimeSeedUser } from "./support/overtimeSeed";
import { boton, campo, esperarToast, irARuta } from "./support/pages/componentes";
import { LoginPage } from "./support/pages/LoginPage";

/**
 * Tiempo extra (`/horarios/horas-extra/aprobacion`) — pantalla única.
 *
 * El escenario se siembra con checadas + vínculo (paquete `api/`): dos personas
 * con 120 min de tiempo extra PENDIENTE del día de hoy. ADMIN/GERENTE aprueban o
 * rechazan y exportan solo lo aprobado; RH entra en solo lectura (el servidor le
 * devuelve únicamente lo aprobado) y JEFE no accede a la ruta.
 */

const RUN = nuevoRunId();
let personaA: OvertimeSeedUser;
let personaB: OvertimeSeedUser;
let rh: OvertimeSeedUser;
let jefe: OvertimeSeedUser;

const filaDe = (page: Parameters<typeof campo>[0], nombre: string) =>
  page.locator("table tbody tr").filter({ hasText: nombre });

/** Contexto aislado (sin la sesión de ADMIN que hereda el proyecto). */
const contextoDe = async (browser: Browser, usuario: string) => {
  const context = await browser.newContext({
    baseURL: E2E.webUrl,
    locale: "es-MX",
    timezoneId: "America/Mazatlan",
    storageState: { cookies: [], origins: [] },
  });
  const page = await context.newPage();
  await new LoginPage(page).entrarComo(usuario);
  return { context, page };
};

test.describe("Tiempo extra", () => {
  test.beforeAll(() => {
    const users = sembrarOvertime(RUN);
    personaA = users.find((u) => u.role === "EMPLEADO" && u.name.endsWith(" A"))!;
    personaB = users.find((u) => u.role === "EMPLEADO" && u.name.endsWith(" B"))!;
    rh = users.find((u) => u.role === "RECURSOS_HUMANOS")!;
    jefe = users.find((u) => u.role === "JEFE_DE_AREA")!;
  });

  test.afterAll(() => limpiarOvertime(RUN));

  test("ADMIN aprueba un día pendiente con confirmación", async ({ page }) => {
    await irARuta(page, "/horarios/horas-extra/aprobacion");
    await campo(page, "Empleado").fill(personaA.name);

    const fila = filaDe(page, personaA.name);
    await expect(fila.getByText("Pendiente")).toBeVisible();
    await fila.getByRole("checkbox").check({ force: true });

    await boton(page, "Aprobar (1)").click();
    // El diálogo de confirmación trae el botón exacto "Aprobar".
    await page.getByRole("button", { name: "Aprobar", exact: true }).click();

    await esperarToast(page, /día\(s\) aprobado\(s\)/);
    await expect(fila.getByText("Aprobado")).toBeVisible();
  });

  test("ADMIN rechaza un día pendiente", async ({ page }) => {
    await irARuta(page, "/horarios/horas-extra/aprobacion");
    await campo(page, "Empleado").fill(personaB.name);

    const fila = filaDe(page, personaB.name);
    await expect(fila.getByText("Pendiente")).toBeVisible();
    await fila.getByRole("checkbox").check({ force: true });

    await boton(page, "Rechazar (1)").click();
    await page.getByRole("button", { name: "Rechazar", exact: true }).click();

    await esperarToast(page, /día\(s\) rechazado\(s\)/);
    await expect(fila.getByText("Rechazado")).toBeVisible();
  });

  test("RH abre en solo lectura; JEFE no accede a la ruta", async ({ browser }) => {
    // RH: entra, ve lo aprobado y ningún control de decisión.
    const { context, page } = await contextoDe(browser, rh.username);
    await irARuta(page, "/horarios/horas-extra/aprobacion");
    await expect(page).toHaveURL(/aprobacion/);

    await expect(boton(page, /Aprobar/)).toHaveCount(0);
    await expect(boton(page, /Rechazar/)).toHaveCount(0);
    await expect(page.getByText("Seleccionar pendientes")).toHaveCount(0);

    // Lo aprobado se ve; lo rechazado no aparece aunque se busque.
    await campo(page, "Empleado").fill(personaA.name);
    await expect(filaDe(page, personaA.name).getByText("Aprobado")).toBeVisible();
    await campo(page, "Empleado").fill(personaB.name);
    await expect(filaDe(page, personaB.name)).toHaveCount(0);
    await context.close();

    // JEFE: RoleGuard lo redirige a inicio.
    const jefeCtx = await contextoDe(browser, jefe.username);
    await jefeCtx.page.goto("/#/horarios/horas-extra/aprobacion");
    await jefeCtx.page.reload();
    await expect(jefeCtx.page).not.toHaveURL(/aprobacion/);
    await jefeCtx.context.close();
  });

  test("ADMIN exporta PDF y CSV solo de lo aprobado; sin aprobados quedan deshabilitados", async ({
    page,
  }) => {
    await irARuta(page, "/horarios/horas-extra/aprobacion");

    const botonPdf = boton(page, "PDF");
    const botonCsv = boton(page, "CSV");

    await campo(page, "Empleado").fill(personaA.name);
    await expect(filaDe(page, personaA.name).getByText("Aprobado")).toBeVisible();
    await expect(botonPdf).toBeEnabled();
    await expect(botonCsv).toBeEnabled();

    const descargaPdf = page.waitForEvent("download");
    await botonPdf.click();
    expect((await descargaPdf).suggestedFilename()).toMatch(
      /^reporte_horas_extra_aprobadas_(day|week|month)_\d{8}\.pdf$/
    );

    const descargaCsv = page.waitForEvent("download");
    await botonCsv.click();
    expect((await descargaCsv).suggestedFilename()).toMatch(
      /^horas-extra-aprobadas-(day|week|month)-\d{4}-\d{2}-\d{2}\.csv$/
    );

    // Sin aprobados en el filtro, no hay nada que exportar.
    await campo(page, "Empleado").fill(`E2E Inexistente ${RUN}`);
    await expect(botonPdf).toBeDisabled();
    await expect(botonCsv).toBeDisabled();
  });

  test("RH también puede exportar el PDF de lo aprobado", async ({ browser }) => {
    const { context, page } = await contextoDe(browser, rh.username);
    await irARuta(page, "/horarios/horas-extra/aprobacion");

    await campo(page, "Empleado").fill(personaA.name);
    await expect(filaDe(page, personaA.name).getByText("Aprobado")).toBeVisible();

    const botonPdf = boton(page, "PDF");
    await expect(botonPdf).toBeEnabled();
    const descarga = page.waitForEvent("download");
    await botonPdf.click();
    expect((await descarga).suggestedFilename()).toMatch(
      /^reporte_horas_extra_aprobadas_(day|week|month)_\d{8}\.pdf$/
    );
    await context.close();
  });
});
