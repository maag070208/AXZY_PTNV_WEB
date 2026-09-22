import { test, expect } from "./support/fixtures";
import { E2E, ruta } from "./support/env";

/**
 * Acceso al sistema. Corre sin la sesión guardada por el proyecto de
 * preparación: aquí justamente se prueba la puerta de entrada.
 */
test.describe("Sesión", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("entra con credenciales válidas y guarda la sesión", async ({ page, login }) => {
    await login.entrarComo(E2E.admin.username);

    await expect(page).not.toHaveURL(/#\/login/);
    const sesion = await login.sesionGuardada();
    expect(sesion?.token).toBeTruthy();
    expect(sesion?.user?.username).toBe(E2E.admin.username);
  });

  test("rechaza credenciales inválidas y no deja pasar", async ({ page, login }) => {
    await login.ir();
    await login.entrar(E2E.admin.username, "contraseña-que-no-es");

    await login.esperarError(/Credenciales inválidas/i);
    await expect(page).toHaveURL(/#\/login/);
    expect((await login.sesionGuardada())?.token ?? null).toBeNull();
  });

  test("una ruta privada manda al login cuando no hay sesión", async ({ page }) => {
    await page.goto(ruta("/inventario/dispositivos"));
    await expect(page).toHaveURL(/#\/login/);
  });

  test("el botón de entrar se habilita hasta que hay usuario y contraseña", async ({
    page,
    login,
  }) => {
    await login.ir();
    const entrar = page.getByRole("button", { name: "Entrar" });
    await expect(entrar).toBeDisabled();

    await page.getByLabel(/^\s*Usuario\s*\*?\s*$/).fill(E2E.admin.username);
    await expect(entrar).toBeDisabled();

    await page.getByLabel(/^\s*Contraseña\s*\*?\s*$/).fill(E2E.password);
    await expect(entrar).toBeEnabled();
  });
});
