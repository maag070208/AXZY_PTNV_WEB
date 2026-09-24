import { test, expect } from "./support/fixtures";
import { E2E, nuevoRunId } from "./support/env";
import { limpiarOvertime, sembrarOvertime, type OvertimeSeedUser } from "./support/overtimeSeed";
import { boton, campo, esperarToast, irARuta } from "./support/pages/componentes";
import { LoginPage } from "./support/pages/LoginPage";

/**
 * Aprobación de tiempo extra (`/horarios/horas-extra/aprobacion`).
 *
 * El escenario se siembra con checadas + vínculo (paquete `api/`): dos personas
 * con 120 min de tiempo extra PENDIENTE del día de hoy. ADMIN/GERENTE aprueban o
 * rechazan; RH y JEFE no tienen acceso a la ruta.
 */

const RUN = nuevoRunId();
let personaA: OvertimeSeedUser;
let personaB: OvertimeSeedUser;
let rh: OvertimeSeedUser;
let jefe: OvertimeSeedUser;

const filaDe = (page: Parameters<typeof campo>[0], nombre: string) =>
  page.locator("table tbody tr").filter({ hasText: nombre });

test.describe("Aprobación de tiempo extra", () => {
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

  test("RH y JEFE no pueden abrir la ruta de aprobación", async ({ browser }) => {
    for (const cuenta of [rh, jefe]) {
      const context = await browser.newContext({
        baseURL: E2E.webUrl,
        locale: "es-MX",
        timezoneId: "America/Mazatlan",
        // Sin la sesión de ADMIN que hereda el proyecto.
        storageState: { cookies: [], origins: [] },
      });
      const page = await context.newPage();
      await new LoginPage(page).entrarComo(cuenta.username);

      await page.goto("/#/horarios/horas-extra/aprobacion");
      await page.reload();
      // RoleGuard redirige a inicio: nunca se queda en la ruta de aprobación.
      await expect(page).not.toHaveURL(/aprobacion/);

      await context.close();
    }
  });
});
