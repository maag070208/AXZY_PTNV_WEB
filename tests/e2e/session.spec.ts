import { test, expect } from "./support/fixtures";
import { E2E, route } from "./support/env";

/**
 * Acceso al sistema. Corre sin la sesión guardada por el proyecto de
 * preparación: aquí justamente se prueba la puerta de entrada.
 */
test.describe("Sesión", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("entra con credenciales válidas y guarda la sesión", async ({ page, login }) => {
    await login.enterAs(E2E.admin.username);

    await expect(page).not.toHaveURL(/#\/login/);
    const session = await login.savedSession();
    expect(session?.token).toBeTruthy();
    expect(session?.user?.username).toBe(E2E.admin.username);
  });

  test("rechaza credenciales inválidas y no deja pasar", async ({ page, login }) => {
    await login.go();
    await login.enter(E2E.admin.username, "contraseña-que-no-es");

    await login.waitForError(/Credenciales inválidas/i);
    await expect(page).toHaveURL(/#\/login/);
    expect((await login.savedSession())?.token ?? null).toBeNull();
  });

  test("una ruta privada manda al login cuando no hay sesión", async ({ page }) => {
    await page.goto(route("/inventory/devices"));
    await expect(page).toHaveURL(/#\/login/);
  });

  test("el botón de entrar se habilita hasta que hay usuario y contraseña", async ({
    page,
    login,
  }) => {
    await login.go();
    const enter = page.getByRole("button", { name: "Entrar" });
    await expect(enter).toBeDisabled();

    await page.getByLabel(/^\s*Usuario\s*\*?\s*$/).fill(E2E.admin.username);
    await expect(enter).toBeDisabled();

    await page.getByLabel(/^\s*Contraseña\s*\*?\s*$/).fill(E2E.password);
    await expect(enter).toBeEnabled();
  });
});
