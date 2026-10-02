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

/**
 * La serie (opcional) se captura EN LA MISMA pantalla de la entrada: es el
 * momento en que las piezas están a la mano. Lo que se deje vacío se puede
 * completar después desde el detalle del dispositivo.
 */
test.describe("ENTRADA con identificación de las piezas nuevas", () => {
  test("guarda la serie capturada en cada pieza", async ({ page, movementPage, scenario, api }) => {
    const device = await scenario.device(1);
    const serie = `SERIE-${scenario.type.code}-1`;
    const serie2 = `SERIE-${scenario.type.code}-2`;

    await movementPage.go();
    await movementPage.selectDevice(device.nameVisible);
    await movementPage.selectType("Entrada");
    await movementPage.writeQuantity(3);
    await movementPage.writePieceSerial(serie, 1);
    await movementPage.writePieceSerial(serie2, 2);
    await movementPage.register();

    await waitForToast(page, "Movimiento registrado");
    await api.waitForStock(device.id, { AVAILABLE: 4 });

    // Cada serie quedó en SU pieza (en orden); la tercera, sin serie.
    const units = await api.units(device.id);
    expect(units.map((u) => u.serialNumber)).toEqual([null, serie, serie2, null]);

    // Y se ve en el kardex del dispositivo, sin recargar nada a mano.
    await goToRoute(page, `/inventory/devices/${device.id}`);
    await expect(page.getByText(serie)).toBeVisible();
  });

  test("no pide identificación si el tipo no la usa", async ({ page, movementPage, api }) => {
    const type = await api.createType({
      code: `E2ENOSN${Date.now().toString(36).toUpperCase()}`,
      name: `Tipo sin serie ${Date.now()}`,
      assetTagPrefix: `E2ENS${Date.now().toString(36).toUpperCase().slice(-5)}`,
      useSerialNumber: false,
    });
    const name = `Equipo sin serie ${Date.now()}`;
    const device = await api.createDevice({ typeId: type.id, name, brand: "TestBrand", model: "TestModel", initialQuantity: 1 });

    await movementPage.go();
    await movementPage.selectDevice(name);
    await movementPage.selectType("Entrada");
    await movementPage.writeQuantity(2);

    await expect(page.getByText(/Identificación de las 2 piezas/)).toHaveCount(0);
    await movementPage.register();
    await waitForToast(page, "Movimiento registrado");
    await api.waitForStock(device.id, { AVAILABLE: 3 });
  });
});
