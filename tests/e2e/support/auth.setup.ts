import { test as setup, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { E2E, API_ROOT } from "./env";
import { LoginPage } from "./pages/LoginPage";

/**
 * Proyecto de preparación: entra una vez por la pantalla de acceso real y
 * guarda la sesión, para que el resto de los tests no repita el login.
 *
 * Los usuarios de prueba los provisiona el paquete `api/`, que es el dueño de
 * la base: aquí sólo se invoca su script para no duplicar Prisma ni el .env en
 * el frontend.
 */
setup("provisiona los usuarios de prueba y guarda la sesión", async ({ page }) => {
  setup.setTimeout(120_000);

  try {
    const output = execFileSync("npm", ["run", "--silent", "test:e2e:provision"], {
      cwd: API_ROOT,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    console.log(output.trim());
  } catch (err) {
    throw new Error(
      `No se pudieron provisionar los usuarios de prueba desde ${API_ROOT}.\n` +
        `Corre ahí "npm run test:e2e:provision" y revisa que Postgres esté arriba.\n` +
        `${err instanceof Error ? err.message : String(err)}`
    );
  }

  const login = new LoginPage(page);
  await login.enterAs(E2E.admin.username);

  // La app guardó la sesión: es lo que se reutiliza en los demás proyectos.
  const session = await login.savedSession();
  expect(session?.token, "la app debió persistir el token tras el login").toBeTruthy();

  await page.context().storageState({ path: E2E.storageState });
});
