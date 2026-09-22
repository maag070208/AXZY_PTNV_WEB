import { expect, type Page } from "@playwright/test";
import { E2E, ruta } from "../env";
import { boton, campo } from "./componentes";

/** Pantalla de acceso. */
export class LoginPage {
  constructor(private readonly page: Page) {}

  async ir(): Promise<void> {
    await this.page.goto(ruta("/login"));
  }

  async entrar(usuario: string, password = E2E.password): Promise<void> {
    await campo(this.page, "Usuario").fill(usuario);
    await campo(this.page, "Contraseña").fill(password);
    await boton(this.page, "Entrar").click();
  }

  /** Login completo, esperando a que la app deje la pantalla de acceso. */
  async entrarComo(usuario: string, password = E2E.password): Promise<void> {
    await this.ir();
    await this.entrar(usuario, password);
    await this.page.waitForURL((url) => !url.hash.startsWith("#/login"), { timeout: 20_000 });
  }

  async esperarError(texto: string | RegExp): Promise<void> {
    await expect(this.page.getByText(texto).first()).toBeVisible({ timeout: 15_000 });
  }

  /** La sesión que la app guarda en localStorage. */
  async sesionGuardada(): Promise<{ token: string | null; user: { username: string } | null } | null> {
    return this.page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, E2E.storageKey);
  }
}
