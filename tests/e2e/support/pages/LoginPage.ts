import { expect, type Page } from "@playwright/test";
import { E2E, route } from "../env";
import { button, field } from "./components";

/** Pantalla de acceso. */
export class LoginPage {
  constructor(private readonly page: Page) {}

  async go(): Promise<void> {
    await this.page.goto(route("/login"));
  }

  async enter(user: string, password = E2E.password): Promise<void> {
    await field(this.page, "Usuario").fill(user);
    await field(this.page, "Contraseña").fill(password);
    await button(this.page, "Entrar").click();
  }

  /** Login completo, esperando a que la app deje la pantalla de acceso. */
  async enterAs(user: string, password = E2E.password): Promise<void> {
    await this.go();
    await this.enter(user, password);
    await this.page.waitForURL((url) => !url.hash.startsWith("#/login"), { timeout: 20_000 });
  }

  async waitForError(text: string | RegExp): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible({ timeout: 15_000 });
  }

  /** La sesión que la app guarda en localStorage. */
  async savedSession(): Promise<{ token: string | null; user: { username: string } | null } | null> {
    return this.page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, E2E.storageKey);
  }
}
