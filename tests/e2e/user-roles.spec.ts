import { test, expect } from "./support/fixtures";
import { E2E, ruta } from "./support/env";

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
    const guardia = (await api.usuarios()).find((u) => u.username === E2E.guard.username);
    expect(guardia, "el guardia de la suite").toBeDefined();

    await page.goto(ruta(`/usuarios/${guardia!.id}/editar`));
    await expect(page.getByRole("textbox", { name: /Apellido paterno/ })).toHaveValue("Guard");
    await page.getByRole("button", { name: "Siguiente" }).click();

    const rol = page.locator('select[name="u_role"]');
    await expect(rol).toHaveValue("GUARD");
    await expect(rol.locator("option", { hasText: "GUARDIA" })).toHaveCount(1);

    await page.getByRole("button", { name: "Guía del rol" }).click();
    await expect(page.getByText(/Opera la portería desde la app/)).toBeVisible();
  });
});
