import { test, expect } from "./support/fixtures";
import { waitForToast, goToRoute, button } from "./support/pages/components";
import { route } from "./support/env";

/**
 * ENTRADA de piezas nuevas por pantalla — "llegaron más".
 *
 * Dos caminos al mismo movimiento:
 *  - el botón "Agregar unidades" del detalle del dispositivo, que abre el
 *    formulario con el dispositivo y el tipo ya elegidos;
 *  - el formulario de movimientos, eligiendo "Entrada" a mano.
 *
 * A diferencia de una baja o un mantenimiento (que mueven una pieza concreta),
 * una entrada crea unidades nuevas: en su renglón se pide CANTIDAD, no unidad.
 */
test.describe("ENTRADA de unidades desde la web", () => {
  test("agrega unidades desde el detalle del dispositivo", async ({
    page,
    scenario,
    api,
  }) => {
    const device = await scenario.device(2);
    await goToRoute(page, `/inventory/devices/${device.id}`);

    await button(page, "Agregar unidades").click();
    await page.waitForURL("**/inventory/movements/new?deviceId=*");
    await expect(page.getByPlaceholder("Buscar dispositivo...").first()).toHaveValue(
      new RegExp(device.nameVisible)
    );

    // El tipo llega elegido desde el atajo y el renglón pide cantidad.
    await expect(page.getByText("Agrega unidades disponibles al inventario.")).toBeVisible();
    await page.getByLabel(/^\s*Cantidad/).fill("3");
    await page.getByRole("button", { name: "Registrar" }).click();

    await waitForToast(page, "Movimiento registrado");
    await page.waitForURL(`**${route("/inventory/movements")}`);

    // Las tres piezas existen, con folio consecutivo, y el disponible subió.
    await api.waitForStock(device.id, { AVAILABLE: 5, active: 5 });
    const units = await api.units(device.id);
    expect(units.map((u) => u.assetTag)).toEqual([
      `${scenario.type.assetTagPrefix}-0001`,
      `${scenario.type.assetTagPrefix}-0002`,
      `${scenario.type.assetTagPrefix}-0003`,
      `${scenario.type.assetTagPrefix}-0004`,
      `${scenario.type.assetTagPrefix}-0005`,
    ]);
  });

  test("registra la entrada desde el formulario de movimientos", async ({
    page,
    movementPage,
    scenario,
    api,
  }) => {
    const device = await scenario.device(1);

    await movementPage.go();
    await movementPage.selectDevice(device.nameVisible);
    await movementPage.selectType("Entrada");
    await movementPage.writeQuantity(4);
    await movementPage.writeReason("Compra de refacciones");
    await movementPage.register();

    await waitForToast(page, "Movimiento registrado");
    await api.waitForStock(device.id, { AVAILABLE: 5 });

    // El kardex muestra la entrada y el motivo.
    const ledger = await api.movements({ deviceId: device.id });
    expect(ledger).toHaveLength(2);
    expect(ledger[0]).toMatchObject({ type: "STOCK_IN", reason: "Compra de refacciones" });
    expect(ledger[0].items[0].quantity).toBe(4);
  });
});
