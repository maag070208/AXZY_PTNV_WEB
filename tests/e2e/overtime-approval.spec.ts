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
 * con 120 min de tiempo extra PENDIENTE del día de hoy. ADMIN/GERENTE aprueban o
 * rechazan y exportan solo lo aprobado; RH entra en solo lectura (el servidor le
 * devuelve únicamente lo aprobado) y JEFE no accede a la ruta.
 */

const RUN = newRunId();
let personA: OvertimeSeedUser;
let personB: OvertimeSeedUser;
let rh: OvertimeSeedUser;
let head: OvertimeSeedUser;

const rowOf = (page: Parameters<typeof field>[0], name: string) =>
  page.locator("table tbody tr").filter({ hasText: name });

/** Contexto aislado (sin la sesión de ADMIN que hereda el proyecto). */
const contextOf = async (browser: Browser, user: string) => {
  const context = await browser.newContext({
    baseURL: E2E.webUrl,
    locale: "es-MX",
    timezoneId: "America/Mazatlan",
    storageState: { cookies: [], origins: [] },
  });
  const page = await context.newPage();
  await new LoginPage(page).enterAs(user);
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

  test("ADMIN aprueba un día pendiente con confirmación", async ({ page }) => {
    await goToRoute(page, "/schedules/overtime/approval");
    await field(page, "Empleado").fill(personA.name);

    const row = rowOf(page, personA.name);
    await expect(row.getByText("Pendiente")).toBeVisible();
    await row.getByRole("checkbox").check({ force: true });

    await button(page, "Aprobar (1)").click();
    // El diálogo de confirmación trae el botón exacto "Aprobar".
    await page.getByRole("button", { name: "Aprobar", exact: true }).click();

    await waitForToast(page, /día\(s\) aprobado\(s\)/);
    await expect(row.getByText("Aprobado")).toBeVisible();
  });

  test("ADMIN rechaza un día pendiente", async ({ page }) => {
    await goToRoute(page, "/schedules/overtime/approval");
    await field(page, "Empleado").fill(personB.name);

    const row = rowOf(page, personB.name);
    await expect(row.getByText("Pendiente")).toBeVisible();
    await row.getByRole("checkbox").check({ force: true });

    await button(page, "Rechazar (1)").click();
    await page.getByRole("button", { name: "Rechazar", exact: true }).click();

    await waitForToast(page, /día\(s\) rechazado\(s\)/);
    await expect(row.getByText("Rechazado")).toBeVisible();
  });

  test("RH abre en solo lectura; JEFE no accede a la ruta", async ({ browser }) => {
    // RH: entra, ve lo aprobado y ningún control de decisión.
    const { context, page } = await contextOf(browser, rh.username);
    await goToRoute(page, "/schedules/overtime/approval");
    await expect(page).toHaveURL(/aprobacion/);

    await expect(button(page, /Aprobar/)).toHaveCount(0);
    await expect(button(page, /Rechazar/)).toHaveCount(0);
    await expect(page.getByText("Seleccionar pendientes")).toHaveCount(0);

    // Lo aprobado se ve; lo rechazado no aparece aunque se busque.
    await field(page, "Empleado").fill(personA.name);
    await expect(rowOf(page, personA.name).getByText("Aprobado")).toBeVisible();
    await field(page, "Empleado").fill(personB.name);
    await expect(rowOf(page, personB.name)).toHaveCount(0);
    await context.close();

    // JEFE: RoleGuard lo redirige a inicio.
    const headCtx = await contextOf(browser, head.username);
    await headCtx.page.goto("/#/schedules/overtime/approval");
    await headCtx.page.reload();
    await expect(headCtx.page).not.toHaveURL(/aprobacion/);
    await headCtx.context.close();
  });

  test("ADMIN exporta PDF y CSV solo de lo aprobado; sin aprobados quedan deshabilitados", async ({
    page,
  }) => {
    await goToRoute(page, "/schedules/overtime/approval");

    const pdfButton = button(page, "PDF");
    const csvButton = button(page, "CSV");

    await field(page, "Empleado").fill(personA.name);
    await expect(rowOf(page, personA.name).getByText("Aprobado")).toBeVisible();
    await expect(pdfButton).toBeEnabled();
    await expect(csvButton).toBeEnabled();

    const downloadPdf = page.waitForEvent("download");
    await pdfButton.click();
    expect((await downloadPdf).suggestedFilename()).toMatch(
      /^reporte_horas_extra_aprobadas_(day|week|month)_\d{8}\.pdf$/
    );

    const downloadCsv = page.waitForEvent("download");
    await csvButton.click();
    expect((await downloadCsv).suggestedFilename()).toMatch(
      /^horas-extra-aprobadas-(day|week|month)-\d{4}-\d{2}-\d{2}\.csv$/
    );

    // Sin aprobados en el filtro, no hay nada que exportar.
    await field(page, "Empleado").fill(`E2E Inexistente ${RUN}`);
    await expect(pdfButton).toBeDisabled();
    await expect(csvButton).toBeDisabled();
  });

  test("RH también puede exportar el PDF de lo aprobado", async ({ browser }) => {
    const { context, page } = await contextOf(browser, rh.username);
    await goToRoute(page, "/schedules/overtime/approval");

    await field(page, "Empleado").fill(personA.name);
    await expect(rowOf(page, personA.name).getByText("Aprobado")).toBeVisible();

    const pdfButton = button(page, "PDF");
    await expect(pdfButton).toBeEnabled();
    const download = page.waitForEvent("download");
    await pdfButton.click();
    expect((await download).suggestedFilename()).toMatch(
      /^reporte_horas_extra_aprobadas_(day|week|month)_\d{8}\.pdf$/
    );
    await context.close();
  });
});
