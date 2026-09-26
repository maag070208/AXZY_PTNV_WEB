import { test, expect } from "./support/fixtures";
import { waitForToast } from "./support/pages/components";
import type { ApiInventory, Stock } from "./support/api";

/**
 * Ciclo de vida completo operado **sólo por pantalla**:
 * alta → préstamo → devolución → mantenimiento → baja.
 *
 * En cada paso se contrasta contra la API y se verifica la regla de
 * consistencia del inventario (DISPOSITIVOS.md §26):
 *
 *     activa    = DISPONIBLE + PRESTADO + DANADO + MANTENIMIENTO
 *     histórica = activa + BAJA
 */
const verify = async (
  api: ApiInventory,
  deviceId: string,
  expected: Partial<Stock>
): Promise<Stock> => {
  const ex = await api.waitForStock(deviceId, expected);
  expect(ex.active).toBe(ex.AVAILABLE + ex.ON_LOAN + ex.DAMAGED + ex.IN_MAINTENANCE);
  expect(ex.historical).toBe(ex.active + ex.RETIREMENT);
  return ex;
};

test.describe("Ciclo completo desde la web", () => {
  test("alta → préstamo → devolución → mantenimiento → baja", async ({
    page,
    registrationPage,
    loanPage,
    loanReturnPage,
    movementPage,
    scenario,
    department,
    api,
  }) => {
    test.setTimeout(120_000);

    const name = scenario.newName("Ciclo");
    let deviceId = "";

    await test.step("1. Alta de 8 unidades desde el formulario", async () => {
      await registrationPage.go();
      await registrationPage.selectType(scenario.type.name);
      await registrationPage.fill({ name, brand: "Samsung", model: "A9", quantity: 8 });
      await registrationPage.save();
      await waitForToast(page, "Dispositivo dado de alta");

      const device = await api.searchDevice(scenario.type.id, name);
      deviceId = device.id;
      await verify(api, deviceId, { AVAILABLE: 8, active: 8, historical: 8 });
    });

    await test.step("2. Préstamo de 5 piezas a un departamento", async () => {
      await loanPage.go();
      await loanPage.assignToDepartment(department.name);
      await loanPage.selectResource(scenario.type.name, name);
      await loanPage.setQuantity(5);
      await loanPage.save();
      await waitForToast(page, "Carta responsiva registrada");

      await verify(api, deviceId, { AVAILABLE: 3, ON_LOAN: 5, active: 8 });
    });

    await test.step("3. Devolución parcial: 2 buenas", async () => {
      const loan = (await api.loans()).find((p) =>
        p.items.some((d) => d.deviceId === deviceId)
      )!;

      await loanReturnPage.go();
      await loanReturnPage.selectLoan(loan.number);
      await loanReturnPage.returnLoan(name, 2, "GOOD");
      await loanReturnPage.register();
      await waitForToast(page, "Devolución registrada");

      expect((await api.loan(loan.id)).status).toBe("PARTIAL");
      await verify(api, deviceId, { AVAILABLE: 5, ON_LOAN: 3, active: 8 });
    });

    await test.step("4. Devolución del resto: 2 buenas y 1 rota", async () => {
      const loan = (await api.loans()).find((p) =>
        p.items.some((d) => d.deviceId === deviceId)
      )!;

      await loanReturnPage.go();
      await loanReturnPage.selectLoan(loan.number);
      await loanReturnPage.returnLoan(name, 2, "GOOD");
      await loanReturnPage.register();
      await waitForToast(page, "Devolución registrada");
      await verify(api, deviceId, { AVAILABLE: 7, ON_LOAN: 1 });

      await loanReturnPage.go();
      await loanReturnPage.selectLoan(loan.number);
      await loanReturnPage.returnLoan(name, 1, "BROKEN", "Pantalla destrozada");
      await expect(loanReturnPage.noticeAutomaticRetirement).toBeVisible();
      await loanReturnPage.register();
      await waitForToast(page, "Devolución registrada");

      expect((await api.loan(loan.id)).status).toBe("RETURNED");
      await verify(api, deviceId, {
        AVAILABLE: 7,
        ON_LOAN: 0,
        RETIREMENT: 1,
        active: 7,
        historical: 8,
      });
    });

    await test.step("5. Mantenimiento: una pieza va al taller y vuelve dañada", async () => {
      const available = (await api.units(deviceId)).find((u) => u.status === "AVAILABLE")!;

      await movementPage.go();
      await movementPage.selectDevice(name);
      await movementPage.selectUnit(available.assetTag);
      await movementPage.selectType("A mantenimiento");
      await movementPage.writeReason("Revisión de batería");
      await movementPage.register();
      await waitForToast(page, "Movimiento registrado");
      await verify(api, deviceId, { AVAILABLE: 6, IN_MAINTENANCE: 1, active: 7 });

      await movementPage.go();
      await movementPage.selectDevice(name);
      await movementPage.selectUnit(available.assetTag);
      await movementPage.selectType("De mantenimiento");
      await movementPage.selectCondition("POOR");
      await movementPage.register();
      await waitForToast(page, "Movimiento registrado");

      await verify(api, deviceId, {
        AVAILABLE: 6,
        IN_MAINTENANCE: 0,
        DAMAGED: 1,
        active: 7,
        historical: 8,
      });
    });

    await test.step("6. Baja de una pieza disponible", async () => {
      const available = (await api.units(deviceId)).find((u) => u.status === "AVAILABLE")!;

      await movementPage.go();
      await movementPage.selectDevice(name);
      await movementPage.selectUnit(available.assetTag);
      await movementPage.selectType("Baja");
      await movementPage.writeReason("Daño irreparable");
      await movementPage.register();
      await waitForToast(page, "Movimiento registrado");

      await verify(api, deviceId, {
        AVAILABLE: 5,
        ON_LOAN: 0,
        DAMAGED: 1,
        IN_MAINTENANCE: 0,
        RETIREMENT: 2,
        active: 6,
        historical: 8,
      });
    });

    await test.step("7. El historial conserva cada paso", async () => {
      const movements = await api.movements({ deviceId });
      const types = movements.map((m) => m.type);

      expect(types).toContain("STOCK_IN");
      expect(types).toContain("LOAN");
      expect(types).toContain("RETURN");
      expect(types).toContain("MAINTENANCE_IN");
      expect(types).toContain("MAINTENANCE_OUT");
      expect(types.filter((t) => t === "RETIREMENT")).toHaveLength(2); // la automática y la manual
      expect(movements.every((m) => m.status === "ACTIVE")).toBe(true);
    });
  });
});
