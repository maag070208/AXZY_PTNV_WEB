import { test, expect } from "./support/fixtures";
import { button, field, goToRoute, waitForToast } from "./support/pages/components";

/**
 * EL CLIENTE ENTRA POR `http://IP:8080`, NO POR localhost.
 *
 * El navegador solo expone `crypto.randomUUID` en **contexto seguro** (https o
 * localhost). En la red local por http esa función NO existe, y la pantalla de
 * Nuevo movimiento se caía al cargar:
 *
 *   Uncaught TypeError: crypto.randomUUID is not a function
 *     at emptyRow … at NewMovementPage
 *
 * Como la suite corre en localhost, nunca lo vio. Estas pruebas reproducen el
 * navegador del cliente (borran la función ANTES de cargar la página) para que
 * la regresión no vuelva: cualquier API que exija contexto seguro tiene que
 * tener respaldo.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Igual que en http://IP: la función no existe.
    Object.defineProperty(window.crypto, "randomUUID", {
      value: undefined,
      configurable: true,
    });
  });
});

test("Nuevo movimiento carga, agrega renglones y registra una entrada", async ({
  page,
  movementPage,
  scenario,
  api,
}) => {
  const device = await scenario.device(1);

  // Carga sin reventar (antes: pantalla en blanco).
  await movementPage.go();
  await expect(page.getByRole("heading", { name: "Nuevo movimiento" })).toBeVisible();

  // Los renglones nuevos también se crean sin `randomUUID`.
  await movementPage.addRow();
  await expect(page.getByText(/^Renglón 2$/)).toBeVisible();
  await button(page, "Eliminar").last().click();
  await expect(page.getByText(/^Renglón 2$/)).toHaveCount(0);

  // Y el movimiento se registra igual.
  await movementPage.selectDevice(device.nameVisible);
  await movementPage.selectType("Entrada");
  await movementPage.writeQuantity(2);
  await movementPage.register();

  await waitForToast(page, "Movimiento registrado");
  await page.waitForURL("**/inventory/movements");
  await api.waitForStock(device.id, { AVAILABLE: 3 });
});

test("ninguna pantalla principal truena sin contexto seguro", async ({ page }) => {
  // Barrido de las pantallas del menú: si alguna usa una API que exige contexto
  // seguro, React desmonta el árbol y el error queda en consola.
  const routes = [
    "/",
    "/inventory",
    "/inventory/devices",
    "/inventory/devices/new",
    "/inventory/types",
    "/inventory/movements",
    "/inventory/movements/new",
    "/inventory/loans",
    "/inventory/loans/new",
    "/inventory/returns",
    "/users",
    "/employees",
    "/employees/records",
    "/tickets",
    "/kitchen",
    "/kitchen/items",
    "/kitchen/lots",
    "/kitchen/stock-in",
    "/kitchen/purchase-orders",
    "/catalogs",
    "/access",
    "/access/report",
    "/schedules",
    "/schedules/assign",
    "/reports",
  ];

  const failures: string[] = [];
  /**
   * Solo errores DE LA APP: el cliente de realtime (Ably) reconecta en bucle
   * cuando no hay llave configurada y eso no tiene que ver con la pantalla.
   */
  const isAppError = (message: string): boolean =>
    !/connection closed|websocket|ably|failed to fetch|networkerror|load failed/i.test(message);
  page.on("pageerror", (error) => {
    if (isAppError(error.message)) failures.push(error.message);
  });

  for (const route of routes) {
    await goToRoute(page, route);
    // Espera a que la pantalla pinte algo (título o primer campo).
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
  }

  expect(failures, `pantallas que truenan sin contexto seguro:\n${failures.join("\n")}`).toEqual([]);
});

test("los formularios capturan sin contexto seguro", async ({ page }) => {
  // El alta de dispositivo arma un renglón de unidad por pieza.
  await goToRoute(page, "/inventory/devices/new");
  await field(page, "Nombre / Modelo").fill("Equipo sin contexto seguro");
  await expect(field(page, "Nombre / Modelo")).toHaveValue("Equipo sin contexto seguro");

  // Y Nuevo movimiento agrega y quita renglones.
  await goToRoute(page, "/inventory/movements/new");
  await button(page, "+ Agregar renglón").click();
  await expect(page.getByText(/^Renglón 2$/)).toBeVisible();
});
