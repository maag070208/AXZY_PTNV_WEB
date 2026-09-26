import { test, expect } from "./support/fixtures";
import { waitForToast } from "./support/pages/components";
import { route } from "./support/env";

/**
 * Flujo ALTA por pantalla — `/inventario/dispositivos/nuevo`.
 *
 * Se opera el formulario como lo haría una persona y después se verifica el
 * efecto real contra la API: unidades creadas, folios y movimiento de ENTRADA.
 */
test.describe("ALTA desde la web", () => {
  test("da de alta un dispositivo con sus unidades y lo confirma en el backend", async ({
    page,
    registrationPage,
    scenario,
    api,
  }) => {
    const name = scenario.newName("Samsung A9");

    await registrationPage.go();
    await registrationPage.selectType(scenario.type.name);
    await registrationPage.fill({ name, brand: "Samsung", model: "SM-X115", quantity: 4 });
    await registrationPage.save();

    await waitForToast(page, "Dispositivo dado de alta");
    await page.waitForURL(`**${route("/inventory/devices")}`);

    // Lo que quedó en la base, no sólo lo que dijo la pantalla.
    const device = await api.searchDevice(scenario.type.id, name);
    const units = await api.units(device.id);
    expect(units).toHaveLength(4);
    expect(units.every((u) => u.status === "AVAILABLE")).toBe(true);
    expect(units[0].assetTag).toBe(`${scenario.type.assetTagPrefix}-0001`);
    expect(units[3].assetTag).toBe(`${scenario.type.assetTagPrefix}-0004`);
  });

  test("el alta queda respaldada por un movimiento de ENTRADA", async ({
    page,
    registrationPage,
    scenario,
    api,
  }) => {
    const name = scenario.newName("Con entrada");

    await registrationPage.go();
    await registrationPage.selectType(scenario.type.name);
    await registrationPage.fill({ name, brand: "Dell", model: "Latitude", quantity: 2 });
    await registrationPage.save();
    await waitForToast(page, "Dispositivo dado de alta");

    const { id: deviceId } = await api.searchDevice(scenario.type.id, name);
    const movements = await api.movements({ deviceId });
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({ type: "STOCK_IN", reason: "Alta inicial" });
    expect(movements[0].items[0].quantity).toBe(2);
  });

  test("captura los datos de una unidad y los guarda", async ({
    page,
    registrationPage,
    scenario,
    api,
  }) => {
    const name = scenario.newName("Con serie");
    const serial = `SN-${scenario.type.code}-1`;

    await registrationPage.go();
    await registrationPage.selectType(scenario.type.name);
    await registrationPage.fill({ name, brand: "Lenovo", model: "T14", quantity: 2 });
    await registrationPage.captureUnit(1, { serialNumber: serial });
    await registrationPage.save();
    await waitForToast(page, "Dispositivo dado de alta");

    const device = await api.searchDevice(scenario.type.id, name);
    const units = await api.units(device.id);
    expect(units).toHaveLength(2);
    expect(units.map((u) => u.serialNumber)).toContain(serial);
  });

  test("la cantidad gobierna cuántas unidades se van a crear", async ({ registrationPage, scenario }) => {
    await registrationPage.go();
    await registrationPage.selectType(scenario.type.name);

    await registrationPage.setQuantity(6);
    await expect(registrationPage.unitRows).toHaveCount(6);

    await registrationPage.setQuantity(2);
    await expect(registrationPage.unitRows).toHaveCount(2);
    await expect(registrationPage.unitsPromise(2)).toBeVisible();
  });

  test("no deja guardar hasta que el formulario está completo", async ({
    registrationPage,
    scenario,
  }) => {
    await registrationPage.go();
    await expect(registrationPage.saveButton).toBeDisabled();

    await registrationPage.selectType(scenario.type.name);
    await expect(registrationPage.saveButton).toBeDisabled();

    await registrationPage.fill({ name: scenario.newName("Incompleto"), brand: "", model: "" });
    await expect(registrationPage.saveButton).toBeDisabled();

    await registrationPage.fill({
      name: scenario.newName("Completo"),
      brand: "Acme",
      model: "X1",
    });
    await expect(registrationPage.saveButton).toBeEnabled();
  });

  test("pide elegir el tipo antes de capturar unidades", async ({ page, registrationPage }) => {
    await registrationPage.go();
    await expect(
      page.getByText("Selecciona un tipo de dispositivo para generar las unidades.")
    ).toBeVisible();
  });

  test("avisa cuando el alta choca con un dispositivo ya registrado", async ({
    page,
    registrationPage,
    scenario,
  }) => {
    const repeated = await scenario.device(1);

    await registrationPage.go();
    await registrationPage.selectType(scenario.type.name);
    await registrationPage.fill({
      name: repeated.nameVisible,
      brand: repeated.brand,
      model: repeated.model,
      quantity: 1,
    });
    await registrationPage.save();

    await waitForToast(page, /duplicado/i);
    // Sigue en el formulario: no navegó como si hubiera guardado.
    await expect(page).toHaveURL(new RegExp(`${route("/inventory/devices/new")}$`));
  });
});
