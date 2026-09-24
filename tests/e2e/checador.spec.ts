import { test, expect } from "./support/fixtures";
import { E2E, ruta } from "./support/env";
import { irARuta } from "./support/pages/componentes";

/**
 * Reloj checador (`/access/checador`): submódulo de Control de acceso con las
 * checadas copiadas del reloj Hikvision (ver CHECADOR.md en la raíz).
 *
 * Las checadas solo entran por la sincronización con el reloj, así que aquí no
 * se siembran: se prueba la pantalla (estado de la sincronización, filtros y la
 * petición server-side a `POST /checador/query`) sin depender del volumen real.
 * No se pulsan "Sincronizar ahora" ni "Importar del reloj": leerían del reloj
 * de verdad.
 */
test.describe("Reloj checador", () => {
  test("ADMIN ve el estado de la sincronización y la tabla pide al servidor con su zona", async ({
    page,
  }) => {
    const consulta = page.waitForResponse(
      (r) => r.url().includes("/checador/query") && r.request().method() === "POST"
    );
    await irARuta(page, "/access/checador");

    await expect(page.getByRole("heading", { level: 1, name: "Reloj checador" })).toBeVisible();
    await expect(page.getByText("Sincronización con el reloj", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Solo lectura: la API nunca modifica la configuración del reloj.")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Sincronizar ahora" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Importar del reloj" })).toBeVisible();

    // El día se corta en la zona del navegador (`timezoneId` de la suite).
    const res = await consulta;
    expect(res.status()).toBe(200);
    const { filters } = res.request().postDataJSON() as { filters: Record<string, unknown> };
    expect(filters.tz).toBe("America/Mazatlan");
    expect(filters.desde).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await expect(page.locator("table thead").getByText("Fecha y hora")).toBeVisible();
  });

  test("el subitem de menú 'Reloj checador' es visible para ADMIN", async ({ page }) => {
    await irARuta(page, "/access/checador");

    // La barra lateral arranca colapsada; al pasar el mouse se expande y el
    // padre (auto-expandido por el subitem activo) muestra sus hijos.
    await page.locator("aside").hover();
    await expect(page.getByText("Reloj checador", { exact: true }).first()).toBeVisible();
  });
});

test.describe("Reloj checador — entradas/salidas y vínculos", () => {
  // Solo lectura: no se vincula nada, para no tocar los datos reales.
  test("el reporte de entradas/salidas del reloj reutiliza el de acceso con su propia fuente", async ({
    page,
  }) => {
    const consulta = page.waitForResponse(
      (r) => r.url().endsWith("/checador/report") && r.request().method() === "POST"
    );
    await irARuta(page, "/access/checador/entradas-salidas");

    await expect(
      page.getByRole("heading", { level: 1, name: "Entradas/salidas del reloj" })
    ).toBeVisible();
    await expect(page.getByText(/empleados del reloj vinculados/)).toBeVisible();

    const res = await consulta;
    expect(res.status()).toBe(200);
    const { filters } = res.request().postDataJSON() as { filters: Record<string, unknown> };
    expect(filters).toMatchObject({ period: "DAY", tz: "America/Mazatlan" });

    await page.getByRole("button", { name: "Vincular empleados" }).click();
    await expect(page).toHaveURL(/#\/access\/checador\/empleados/);
  });

  test("la pantalla de vínculos lista los empleados del reloj con sus sugerencias", async ({ page }) => {
    const consulta = page.waitForResponse((r) => r.url().includes("/checador/empleados/query"));
    await irARuta(page, "/access/checador/empleados");

    await expect(page.getByRole("heading", { level: 1, name: "Empleados del reloj" })).toBeVisible();
    expect((await consulta).status()).toBe(200);
    await expect(page.getByText("En el reloj", { exact: true })).toBeVisible();
    await expect(page.getByText("Sugerencias seguras", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Vincular \d+ sugerencias seguras/ })).toBeVisible();
  });
});

test.describe("Reloj checador — gate por rol", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("un EMPLEADO no accede al checador", async ({ page, login }) => {
    await login.entrarComo(E2E.empleado.username);

    await page.goto(ruta("/access/checador"));

    await expect(page).not.toHaveURL(/#\/access\/checador/);
    await expect(page.getByRole("heading", { name: "Reloj checador" })).toHaveCount(0);

    for (const destino of ["/access/checador/entradas-salidas", "/access/checador/empleados"]) {
      await page.goto(ruta(destino));
      await expect(page).not.toHaveURL(/#\/access\/checador/);
    }
  });
});
