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

    // La edición es un diálogo sobre la lista: sin asistente, todo a la vista.
    await page.goto(route(`/users/${guard!.id}/edit`));
    const dialog = page.locator('[data-it-dialog="true"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("textbox", { name: /Apellido paterno/ })).toHaveValue("Guard");

    const role = dialog.locator('select[name="u_role"]');
    await expect(role).toHaveValue("GUARD");
    await expect(role.locator("option", { hasText: "GUARDIA" })).toHaveCount(1);

    await dialog.getByRole("button", { name: "Guía del rol" }).click();
    await expect(page.getByText(/Opera la portería desde la app/)).toBeVisible();
  });
});
