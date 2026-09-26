import { test, expect } from "./support/fixtures";
import { waitForToast } from "./support/pages/components";
import { route } from "./support/env";

/**
 * Flujo BAJA por pantalla — `/inventario/movimientos/nuevo`.
 *
 * La pantalla sólo ofrece unidades disponibles o en mantenimiento, así que las
 * piezas prestadas quedan fuera de alcance por construcción (§17 del doc).
 */
test.describe("BAJA desde la web", () => {
  test("da de baja una unidad con su motivo", async ({
    page,
    movementPage,
    scenario,
    api,
  }) => {
    const device = await scenario.device(5);
    const [unit] = await api.units(device.id);

    await movementPage.go();
    await movementPage.selectDevice(device.nameVisible);
    await movementPage.selectUnit(unit.assetTag);
    await movementPage.selectType("Baja");
    await movementPage.writeReason("Daño irreparable");
    await movementPage.register();

    await waitForToast(page, "Movimiento registrado");
    await page.waitForURL(`**${route("/inventory/movements")}`);

    // La baja sale de la existencia activa pero permanece en la histórica.
    const stock = await api.waitForStock(device.id, {
      AVAILABLE: 4,
      RETIREMENT: 1,
    });
    expect(stock.active).toBe(4);
    expect(stock.historical).toBe(5);

    const units = await api.units(device.id);
    expect(units.find((u) => u.id === unit.id)?.status).toBe("RETIREMENT");
  });

  test("exige motivo para dar de baja", async ({ movementPage, scenario, api }) => {
    const device = await scenario.device(3);
    const [unit] = await api.units(device.id);

    await movementPage.go();
    await movementPage.selectDevice(device.nameVisible);
    await movementPage.selectUnit(unit.assetTag);
    await movementPage.selectType("Baja");

    await expect(movementPage.registerButton).toBeDisabled();
    await movementPage.writeReason("Obsoleto");
    await expect(movementPage.registerButton).toBeEnabled();
  });

  test("las unidades prestadas no se ofrecen para dar de baja", async ({
    movementPage,
    scenario,
    department,
    api,
  }) => {
    const device = await scenario.device(4);
    const units = await api.units(device.id);
    await api.lend({
      departmentId: department.id,
      items: [{ deviceId: device.id, quantity: 3 }],
    });

    const loaned = (await api.units(device.id))
      .filter((u) => u.status === "ON_LOAN")
      .map((u) => u.assetTag);
    expect(loaned).toHaveLength(3);

    await movementPage.go();
    await movementPage.selectDevice(device.nameVisible);
    await movementPage.selectType("Baja");

    // Sólo la pieza que quedó disponible aparece en el desplegable.
    const offered = await movementPage.offeredUnits();
    expect(offered).toHaveLength(1);
    for (const assetTag of loaned) {
      expect(offered.join(" ")).not.toContain(assetTag);
    }
    expect(units.map((u) => u.assetTag)).toContain(
      offered[0].split(" ")[0].replace(/\s.*$/, "")
    );
  });

  test("una unidad ya dada de baja deja de ofrecerse", async ({
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
    await movementPage.selectType("Baja");
    await movementPage.writeReason("Robo");
    await movementPage.register();
    await waitForToast(page, "Movimiento registrado");
    await api.waitForStock(device.id, { RETIREMENT: 1, AVAILABLE: 1 });

    await movementPage.go();
    await movementPage.selectDevice(device.nameVisible);
    await movementPage.selectType("Baja");

    const offered = await movementPage.offeredUnits();
    expect(offered).toHaveLength(1);
    expect(offered.join(" ")).not.toContain(unit.assetTag);
  });

  test("da de baja dos dispositivos en un mismo movimiento", async ({
    page,
    movementPage,
    scenario,
    api,
  }) => {
    const one = await scenario.device(3);
    const other = await scenario.device(3);
    const [unitOne] = await api.units(one.id);
    const [otherUnit] = await api.units(other.id);

    await movementPage.go();
    await movementPage.selectDevice(one.nameVisible, 1);
    await movementPage.selectUnit(unitOne.assetTag, 1);
    await movementPage.selectType("Baja", 1);
    await movementPage.writeReason("Retiro de lote", 1);

    await movementPage.addRow();
    await movementPage.selectDevice(other.nameVisible, 2);
    await movementPage.selectUnit(otherUnit.assetTag, 2);
    await movementPage.selectType("Baja", 2);
    await movementPage.writeReason("Retiro de lote", 2);

    await movementPage.register();
    await waitForToast(page, "Movimiento registrado");

    await api.waitForStock(one.id, { AVAILABLE: 2, RETIREMENT: 1 });
    await api.waitForStock(other.id, { AVAILABLE: 2, RETIREMENT: 1 });

    // Los dos renglones viajaron en un solo movimiento de BAJA.
    const retirements = await api.movements({ deviceId: one.id, type: "RETIREMENT" });
    expect(retirements).toHaveLength(1);
    expect(retirements[0].items).toHaveLength(2);
  });

  test("la baja queda registrada en el historial de movimientos", async ({
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
    await movementPage.selectType("Baja");
    await movementPage.writeReason("Daño por agua");
    await movementPage.register();
    await waitForToast(page, "Movimiento registrado");

    await page.goto(route("/inventory/movements"));
    await expect(page.getByText("Daño por agua").first()).toBeVisible();
    await expect(page.getByText(device.nameVisible).first()).toBeVisible();
  });
});
