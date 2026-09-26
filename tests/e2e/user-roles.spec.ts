import { test, expect } from "./support/fixtures";
import { E2E, route } from "./support/env";

/**
 * Rol Guardia en el formulario de usuarios. El guardia (`GUARD`) opera la
 * portería desde la app; la web lo da de alta y lo muestra como "GUARDIA".
 * Usa el guardia que provisiona la suite (`e2e_guard`); no modifica nada.
 */
test.describe("Usuarios — rol Guardia", () => {
  test("el formulario ofrece GUARDIA y abre la edición de un guardia con su guía", async ({
    page,
    api,
  }) => {
    const guard = (await api.users()).find((u) => u.username === E2E.guard.username);
    expect(guard, "el guardia de la suite").toBeDefined();

    await page.goto(route(`/users/${guard!.id}/edit`));
    await expect(page.getByRole("textbox", { name: /Apellido paterno/ })).toHaveValue("Guard");
    await page.getByRole("button", { name: "Siguiente" }).click();

    const role = page.locator('select[name="u_role"]');
    await expect(role).toHaveValue("GUARD");
    await expect(role.locator("option", { hasText: "GUARDIA" })).toHaveCount(1);

    await page.getByRole("button", { name: "Guía del rol" }).click();
    await expect(page.getByText(/Opera la portería desde la app/)).toBeVisible();
  });
});
