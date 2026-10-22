import { test, expect } from "./support/fixtures";
import { E2E, route } from "./support/env";
import { goToRoute } from "./support/pages/components";

/**
 * Galería de Langostin: la pantalla con todas las animaciones de la mascota y
 * los ocho escenarios donde vive. Es de ADMIN (`system.configure`).
 */
test.describe("Galería de Langostin — ADMIN", () => {
  test("el menú tiene la entrada y lleva a la galería", async ({ page }) => {
    await goToRoute(page, "/");

    const menu = page.locator("aside");
    await menu.hover();
    await menu.getByText("Langostin", { exact: true }).click();

    await expect(page).toHaveURL(/#\/langostin/);
    await expect(page.getByRole("heading", { name: "Langostin" })).toBeVisible();
  });

  test("muestra todas las animaciones y todos los escenarios", async ({ page }) => {
    await goToRoute(page, "/langostin");

    // 36 animaciones en 6 grupos.
    await expect(page.locator('[data-testid^="langostin-anim-"]')).toHaveCount(36);
    // 8 escenarios.
    await expect(page.locator('[data-testid^="langostin-scene-"]')).toHaveCount(8);

    // El escenario de arranque: el hotel con la mascota en reposo.
    await expect(page.getByTestId("langostin-stage-scene")).toHaveText("Hotel");
    await expect(page.getByTestId("langostin-stage-anim")).toHaveText("Reposo");
  });

  test("elegir una animación la lleva al escenario", async ({ page }) => {
    await goToRoute(page, "/langostin");

    await page.getByTestId("langostin-anim-dance").click();
    await expect(page.getByTestId("langostin-stage-anim")).toHaveText("Baile");

    // Y elegir un escenario lo cambia en el escenario grande.
    await page.getByTestId("langostin-scene-noche").click();
    await expect(page.getByTestId("langostin-stage-scene")).toHaveText("Noche");
  });
});

test.describe("Galería de Langostin — gate por rol", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("un EMPLEADO no ve la entrada ni accede a la galería", async ({ page, login }) => {
    await login.enterAs(E2E.employee.username);

    await page.goto(route("/"));

    const menu = page.locator("aside");
    await menu.hover();
    await expect(menu.getByText("Langostin", { exact: true })).toHaveCount(0);

    await page.goto(route("/langostin"));
    await expect(page).not.toHaveURL(/#\/langostin/);
    await expect(page.getByRole("heading", { name: "Langostin" })).toHaveCount(0);
  });
});
