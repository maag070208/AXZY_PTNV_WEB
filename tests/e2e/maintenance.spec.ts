import { test, expect } from "./support/fixtures";
import { waitForToast } from "./support/pages/components";
import { route } from "./support/env";

/**
 * Flujo MOVIMIENTOS DE MANTENIMIENTO por pantalla — `/inventario/movimientos/nuevo`.
 *
 * A diferencia de la API, la pantalla trabaja por unidad física: cada renglón
 * mueve una pieza concreta, elegida por su activo fijo.
 */
test.describe("MANTENIMIENTO desde la web", () => {
  test("manda una unidad a mantenimiento", async ({ page, movementPage, scenario, api }) => {
    const device = await scenario.device(4);
    const [unit] = await api.units(device.id);

    await movementPage.go();
    await movementPage.selectDevice(device.nameVisible);
    await movementPage.selectUnit(unit.assetTag);
    await movementPage.selectType("A mantenimiento");
    await movementPage.writeReason("Revisión preventiva");
    await movementPage.register();

    await waitForToast(page, "Movimiento registrado");
    await page.waitForURL(`**${route("/inventory/movements")}`);

    await api.waitForStock(device.id, { AVAILABLE: 3, IN_MAINTENANCE: 1 });

    // Se movió exactamente la unidad elegida.
    const units = await api.units(device.id);
    expect(units.find((u) => u.id === unit.id)?.status).toBe("IN_MAINTENANCE");
  });

  test("regresa una unidad de mantenimiento en buen estado", async ({
    page,
    movementPage,
    scenario,
    api,
  }) => {
    const device = await scenario.device(3);
    const [unit] = await api.units(device.id);

    await movementPage.go();
    await movementPage.selectDevice(device.nameVisible);
    await movementPage.selectUnit(unit.assetTag);
    await movementPage.selectType("A mantenimiento");
    await movementPage.writeReason("Cambio de batería");
    await movementPage.register();
    await waitForToast(page, "Movimiento registrado");
    await api.waitForStock(device.id, { IN_MAINTENANCE: 1 });

    await movementPage.go();
    await movementPage.selectDevice(device.nameVisible);
    await movementPage.selectUnit(unit.assetTag);
    await movementPage.selectType("De mantenimiento");
    await movementPage.selectCondition("GOOD");
    await movementPage.register();
    await waitForToast(page, "Movimiento registrado");

    await api.waitForStock(device.id, { AVAILABLE: 3, IN_MAINTENANCE: 0 });
  });

  test("una unidad que vuelve en mal estado queda dañada", async ({
    page,
    movementPage,
    scenario,
    api,
  }) => {
    const device = await scenario.device(3);
    const [unit] = await api.units(device.id);

    await movementPage.go();
    await movementPage.selectDevice(device.nameVisible);
    await movementPage.selectUnit(unit.assetTag);
    await movementPage.selectType("A mantenimiento");
    await movementPage.writeReason("Diagnóstico");
    await movementPage.register();
    await waitForToast(page, "Movimiento registrado");
    await api.waitForStock(device.id, { IN_MAINTENANCE: 1 });

    await movementPage.go();
    await movementPage.selectDevice(device.nameVisible);
    await movementPage.selectUnit(unit.assetTag);
    await movementPage.selectType("De mantenimiento");
    await movementPage.selectCondition("POOR");
    await movementPage.writeComment("Teclado intermitente");
    await movementPage.register();
    await waitForToast(page, "Movimiento registrado");

    await api.waitForStock(device.id, { AVAILABLE: 2, DAMAGED: 1, IN_MAINTENANCE: 0 });
  });

  test("una unidad que vuelve ROTA avisa y se da de baja sola", async ({
    page,
    movementPage,
    scenario,
    api,
  }) => {
    const device = await scenario.device(3);
    const [unit] = await api.units(device.id);

    await movementPage.go();
    await movementPage.selectDevice(device.nameVisible);
    await movementPage.selectUnit(unit.assetTag);
    await movementPage.selectType("A mantenimiento");
    await movementPage.writeReason("Revisión");
    await movementPage.register();
    await waitForToast(page, "Movimiento registrado");
    await api.waitForStock(device.id, { IN_MAINTENANCE: 1 });

    await movementPage.go();
    await movementPage.selectDevice(device.nameVisible);
    await movementPage.selectUnit(unit.assetTag);
    await movementPage.selectType("De mantenimiento");
    await movementPage.selectCondition("BROKEN");

    await expect(movementPage.noticeAutomaticRetirement).toBeVisible();
    await movementPage.register();
    await waitForToast(page, "Movimiento registrado");

    await api.waitForStock(device.id, { AVAILABLE: 2, RETIREMENT: 1, IN_MAINTENANCE: 0 });
    const retirements = await api.movements({ deviceId: device.id, type: "RETIREMENT" });
    expect(retirements[0].reason).toBe("Baja automática por estado ROTO");
  });

  test("sólo ofrece los movimientos que caben según el estado de la unidad", async ({
    movementPage,
    scenario,
    api,
  }) => {
    const device = await scenario.device(2);
    const [unit] = await api.units(device.id);

    await movementPage.go();
    await movementPage.selectDevice(device.nameVisible);
    await movementPage.selectUnit(unit.assetTag);

    // Unidad disponible: se puede dar de baja o mandar a mantenimiento, no traerla de vuelta.
    const row = movementPage.row();
    await expect(row.getByRole("button", { name: "Baja" })).toBeVisible();
    await expect(row.getByRole("button", { name: "A mantenimiento" })).toBeVisible();
    await expect(row.getByRole("button", { name: "De mantenimiento" })).toBeHidden();
  });

  test("no ofrece unidades que no estén en el estado que pide el movimiento", async ({
    movementPage,
    scenario,
  }) => {
    const device = await scenario.device(2);

    await movementPage.go();
    await movementPage.selectDevice(device.nameVisible);
    // Sin unidad elegida, los tres tipos están disponibles: al pedir "De
    // mantenimiento" no hay ninguna pieza en taller que ofrecer.
    await movementPage.selectType("De mantenimiento");

    await expect(movementPage.noticeWithoutUnits).toBeVisible();
    await expect(movementPage.registerButton).toBeDisabled();
  });

  test("exige motivo para mandar a mantenimiento", async ({
    movementPage,
    scenario,
    api,
  }) => {
    const device = await scenario.device(2);
    const [unit] = await api.units(device.id);

    await movementPage.go();
    await movementPage.selectDevice(device.nameVisible);
    await movementPage.selectUnit(unit.assetTag);
    await movementPage.selectType("A mantenimiento");

    await expect(movementPage.registerButton).toBeDisabled();
    await movementPage.writeReason("Ya con motivo");
    await expect(movementPage.registerButton).toBeEnabled();
  });

  test("exige condición al regresar de mantenimiento", async ({
    page,
    movementPage,
    scenario,
    api,
  }) => {
    const device = await scenario.device(2);
    const [unit] = await api.units(device.id);

    await movementPage.go();
    await movementPage.selectDevice(device.nameVisible);
    await movementPage.selectUnit(unit.assetTag);
    await movementPage.selectType("A mantenimiento");
    await movementPage.writeReason("Revisión");
    await movementPage.register();
    await waitForToast(page, "Movimiento registrado");
    await api.waitForStock(device.id, { IN_MAINTENANCE: 1 });

    await movementPage.go();
    await movementPage.selectDevice(device.nameVisible);
    await movementPage.selectUnit(unit.assetTag);
    await movementPage.selectType("De mantenimiento");

    await expect(movementPage.registerButton).toBeDisabled();
    await movementPage.selectCondition("FAIR");
    await expect(movementPage.registerButton).toBeEnabled();
  });
});
