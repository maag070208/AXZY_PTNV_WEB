import { test, expect } from "./support/fixtures";
import type { Browser } from "@playwright/test";
import { E2E, newRunId } from "./support/env";
import { clearOvertime, seedOvertime, type OvertimeSeedUser } from "./support/overtimeSeed";
import { button, field, waitForToast, goToRoute } from "./support/pages/components";
import { LoginPage } from "./support/pages/LoginPage";

/**
 * Tiempo extra (`/horarios/horas-extra/aprobacion`) — pantalla única.
 *
 * El escenario se siembra con checadas + vínculo (paquete `api/`): dos personas
 * con 120 min de tiempo extra PENDIENTE del día de hoy. ADMIN/MANAGER aprueban o
 * rechazan y exportan la tabla (cada día con su estado); HUMAN_RESOURCES entra en
 * solo lectura (el servidor le devuelve únicamente lo aprobado) y AREA_HEAD no
 * accede a la ruta.
 */

const RUN = newRunId();
let personA: OvertimeSeedUser;
let personB: OvertimeSeedUser;
let rh: OvertimeSeedUser;
let head: OvertimeSeedUser;

const rowOf = (page: Parameters<typeof field>[0], name: string) =>
  page.locator("table tbody tr").filter({ hasText: name });

/** Pestaña de estatus (Pendientes, Aprobadas, Rechazadas, Todas). */
const statusTab = (page: Parameters<typeof field>[0], name: string) => page.getByRole("tab", { name });

/** Contexto aislado (sin la sesión de ADMIN que hereda el proyecto). */
const contextOf = async (browser: Browser, user: string) => {
  const context = await browser.newContext({
    baseURL: E2E.webUrl,
    locale: "es-MX",
    timezoneId: "America/Mexico_City",
    storageState: { cookies: [], origins: [] },
  });
  const page = await context.newPage();
  await new LoginPage(page).enterAs(user);
  // El login devuelve el usuario SIN permisos; `meThunk` los carga enseguida y
  // los persiste. Se espera a que existan antes de navegar para que el guard de
  // la ruta no redirija a inicio con la sesión todavía sin permisos.
  await page.waitForFunction(
    (key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const state = JSON.parse(raw) as { user?: { permissions?: Record<string, string> } };
      return Object.keys(state.user?.permissions ?? {}).length > 0;
    },
    E2E.storageKey
  );
  return { context, page };
};

test.describe("Tiempo extra", () => {
  test.beforeAll(() => {
    const users = seedOvertime(RUN);
    personA = users.find((u) => u.role === "EMPLOYEE" && u.name.endsWith(" A"))!;
    personB = users.find((u) => u.role === "EMPLOYEE" && u.name.endsWith(" B"))!;
    rh = users.find((u) => u.role === "HUMAN_RESOURCES")!;
    head = users.find((u) => u.role === "AREA_HEAD")!;
  });

  test.afterAll(() => clearOvertime(RUN));

  test("ADMIN aprueba un día pendiente desde su renglón", async ({ page }) => {
    await goToRoute(page, "/schedules/overtime/approval");
    await field(page, "Empleado").fill(personA.name);

    // Pendientes es la pestaña por defecto: el renglón trae sus botones de decisión.
    const row = rowOf(page, personA.name);
    await button(row, "Aprobar").click();

    await waitForToast(page, /día\(s\) aprobado\(s\)/);
    await statusTab(page, /Aprobadas/).click();
    await expect(row.getByText("Aprobada")).toBeVisible();
  });

  test("ADMIN rechaza un día pendiente con motivo", async ({ page }) => {
    await goToRoute(page, "/schedules/overtime/approval");
    await field(page, "Empleado").fill(personB.name);

    const row = rowOf(page, personB.name);
    await button(row, "Rechazar").click();
    await field(page, "Motivo (opcional)").fill("Sin autorización previa");
    // El diálogo se monta al final del body: su botón "Rechazar" es el último.
    await button(page, "Rechazar").last().click();

    await waitForToast(page, /día\(s\) rechazado\(s\)/);
    await statusTab(page, /Rechazadas/).click();
    await expect(row.getByText("Rechazada")).toBeVisible();
    await expect(row.getByText("Sin autorización previa")).toBeVisible();
  });

  test("RH abre en solo lectura; JEFE no accede a la ruta", async ({ browser }) => {
    // RH: entra, ve lo aprobado y ningún control de decisión.
    const { context, page } = await contextOf(browser, rh.username);
    await goToRoute(page, "/schedules/overtime/approval");
    await expect(page).toHaveURL(/approval/);

    await expect(button(page, /Aprobar/)).toHaveCount(0);
    await expect(button(page, /Rechazar/)).toHaveCount(0);
    await expect(page.getByText("Seleccionar pendientes")).toHaveCount(0);

    // Lo aprobado se ve; lo rechazado no aparece aunque se busque.
    await field(page, "Empleado").fill(personA.name);
    await expect(rowOf(page, personA.name).getByText("Aprobada")).toBeVisible();
    await field(page, "Empleado").fill(personB.name);
    await expect(rowOf(page, personB.name)).toHaveCount(0);
    await context.close();

    // AREA_HEAD no tiene `overtime.view`: el guard lo redirige a inicio.
    const headCtx = await contextOf(browser, head.username);
    await headCtx.page.goto("/#/schedules/overtime/approval");
    await headCtx.page.reload();
    await expect(headCtx.page).not.toHaveURL(/approval/);
    await headCtx.context.close();
  });

  test("ADMIN exporta PDF y CSV de la tabla; sin filas quedan deshabilitados", async ({
    page,
  }) => {
    await goToRoute(page, "/schedules/overtime/approval");

    const pdfButton = button(page, "PDF");
    const csvButton = button(page, "CSV");

    await statusTab(page, /Aprobadas/).click();
    await field(page, "Empleado").fill(personA.name);
    await expect(rowOf(page, personA.name).getByText("Aprobada")).toBeVisible();
    await expect(pdfButton).toBeEnabled();
    await expect(csvButton).toBeEnabled();

    const downloadPdf = page.waitForEvent("download");
    await pdfButton.click();
    expect((await downloadPdf).suggestedFilename()).toMatch(
      /^reporte_horas_extra_(day|week|fortnight|month)_\d{8}\.pdf$/
    );

    const downloadCsv = page.waitForEvent("download");
    await csvButton.click();
    expect((await downloadCsv).suggestedFilename()).toMatch(
      /^reporte_horas_extra-(day|week|fortnight|month)-\d{4}-\d{2}-\d{2}\.csv$/
    );

    // Sin filas en el filtro, no hay nada que exportar.
    await field(page, "Empleado").fill(`E2E Inexistente ${RUN}`);
    await expect(pdfButton).toBeDisabled();
    await expect(csvButton).toBeDisabled();
  });

  test("RH también puede exportar el PDF de su vista", async ({ browser }) => {
    const { context, page } = await contextOf(browser, rh.username);
    await goToRoute(page, "/schedules/overtime/approval");

    await field(page, "Empleado").fill(personA.name);
    await expect(rowOf(page, personA.name).getByText("Aprobada")).toBeVisible();

    const pdfButton = button(page, "PDF");
    await expect(pdfButton).toBeEnabled();
    const download = page.waitForEvent("download");
    await pdfButton.click();
    expect((await download).suggestedFilename()).toMatch(
      /^reporte_horas_extra_(day|week|fortnight|month)_\d{8}\.pdf$/
    );
    await context.close();
  });
});
