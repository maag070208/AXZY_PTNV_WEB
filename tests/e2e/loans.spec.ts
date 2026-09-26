import { test, expect } from "./support/fixtures";
import { waitForToast } from "./support/pages/components";
import { route } from "./support/env";

/** El `Área:` de la carta imprime el departamento sin el prefijo "Departamento de ". */
const areaExpected = (departmentName: string): string =>
  departmentName.replace(/^Departamento de /i, "");

const matchInsensible = (text: string): RegExp =>
  new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

/**
 * Flujo PRÉSTAMOS por pantalla — `/inventario/prestamos/nuevo` y
 * `/inventario/devoluciones/nueva`.
 *
 * El dispositivo se siembra por API (dar de alta ya tiene su propio spec) y a
 * partir de ahí todo se opera como usuario.
 */
test.describe("PRÉSTAMOS desde la web", () => {
  test("presta a un departamento y descuenta las existencias", async ({
    page,
    loanPage,
    scenario,
    department,
    api,
  }) => {
    const device = await scenario.device(10);

    await loanPage.go();
    await loanPage.assignToDepartment(department.name);
    await loanPage.selectResource(scenario.type.name, device.nameVisible);
    await loanPage.setQuantity(4);
    await loanPage.writeNotes("Entrega para proyecto X");
    await loanPage.save();

    await waitForToast(page, "Carta responsiva registrada");
    await page.waitForURL(`**${route("/inventory/loans")}`);

    await api.waitForStock(device.id, { AVAILABLE: 6, ON_LOAN: 4 });

    const loans = await api.loans();
    const created = loans.find((p) =>
      p.items.some((d) => d.deviceId === device.id)
    );
    expect(created?.status).toBe("ACTIVE");
    expect(created?.number).toMatch(/^CARTA-\d{4}$/);
  });

  test("muestra el disponible real del dispositivo elegido", async ({
    loanPage,
    scenario,
    department,
  }) => {
    const device = await scenario.device(7);

    await loanPage.go();
    await loanPage.assignToDepartment(department.name);
    await loanPage.selectResource(scenario.type.name, device.nameVisible);

    await expect(loanPage.available).toContainText("7");
  });

  test("no deja prestar más de lo disponible", async ({
    loanPage,
    scenario,
    department,
    api,
  }) => {
    const device = await scenario.device(3);

    await loanPage.go();
    await loanPage.assignToDepartment(department.name);
    await loanPage.selectResource(scenario.type.name, device.nameVisible);
    await loanPage.setQuantity(5);

    await expect(loanPage.overstockAlert).toBeVisible();
    await expect(loanPage.saveButton).toBeDisabled();

    // Y al corregir, la pantalla vuelve a habilitar el guardado.
    await loanPage.setQuantity(3);
    await expect(loanPage.overstockAlert).toBeHidden();
    await expect(loanPage.saveButton).toBeEnabled();

    // Nada se movió por haberlo intentado.
    expect(await api.stock(device.id)).toMatchObject({ AVAILABLE: 3, ON_LOAN: 0 });
  });

  test("presta a un empleado", async ({ page, loanPage, scenario, api }) => {
    const device = await scenario.device(5);

    await loanPage.go();
    await loanPage.assignToEmployee("E2E Empleado");
    await loanPage.selectResource(scenario.type.name, device.nameVisible);
    await loanPage.setQuantity(2);
    await loanPage.save();

    await waitForToast(page, "Carta responsiva registrada");
    await api.waitForStock(device.id, { AVAILABLE: 3, ON_LOAN: 2 });
  });

  test("la carta recién creada aparece en el listado con su folio y estado", async ({
    page,
    loanPage,
    scenario,
    department,
    api,
  }) => {
    const device = await scenario.device(4);

    await loanPage.go();
    await loanPage.assignToDepartment(department.name);
    await loanPage.selectResource(scenario.type.name, device.nameVisible);
    await loanPage.setQuantity(1);
    await loanPage.save();
    await waitForToast(page, "Carta responsiva registrada");

    const created = (await api.loans()).find((p) =>
      p.items.some((d) => d.deviceId === device.id)
    )!;

    await page.goto(route("/inventory/loans"));
    await expect(page.getByText(created.number)).toBeVisible();
    await expect(page.getByText("ACTIVE").first()).toBeVisible();
  });

  test("el preview de la carta muestra el departamento elegido en Área", async ({
    loanPage,
    department,
  }) => {
    await loanPage.go();
    await loanPage.assignToDepartment(department.name);

    await expect(loanPage.areaPreview).toHaveText(
      matchInsensible(areaExpected(department.name))
    );
  });

  test("Área del preview cambia al cambiar de departamento", async ({
    loanPage,
    api,
  }) => {
    const departments = await api.departments();
    test.skip(departments.length < 2, "Se necesitan al menos dos departamentos sembrados");
    const [first, second] = departments;

    await loanPage.go();
    await loanPage.assignToDepartment(first.name);
    await expect(loanPage.areaPreview).toHaveText(
      matchInsensible(areaExpected(first.name))
    );

    await loanPage.assignToDepartment(second.name);
    await expect(loanPage.areaPreview).toHaveText(
      matchInsensible(areaExpected(second.name))
    );
  });

  test.describe("returns", () => {
    test("la devolución parcial deja la carta en PARCIAL", async ({
      page,
      loanReturnPage,
      scenario,
      department,
      api,
    }) => {
      const device = await scenario.device(10);
      const loan = await api.lend({
        departmentId: department.id,
        items: [{ deviceId: device.id, quantity: 6 }],
      });

      await loanReturnPage.go();
      await loanReturnPage.selectLoan(loan.number);
      await expect(loanReturnPage.counter(device.nameVisible, "Pendiente")).toContainText("6");

      await loanReturnPage.returnLoan(device.nameVisible, 2, "GOOD");
      await loanReturnPage.register();
      await waitForToast(page, "Devolución registrada");

      await api.waitForStock(device.id, { AVAILABLE: 6, ON_LOAN: 4 });
      const updated = await api.loan(loan.id);
      expect(updated.status).toBe("PARTIAL");
      expect(updated.items[0]).toMatchObject({ quantity: 6, returnedQuantity: 2 });
    });

    test("la devolución total deja la carta en DEVUELTO", async ({
      page,
      loanReturnPage,
      scenario,
      department,
      api,
    }) => {
      const device = await scenario.device(6);
      const loan = await api.lend({
        departmentId: department.id,
        items: [{ deviceId: device.id, quantity: 3 }],
      });

      await loanReturnPage.go();
      await loanReturnPage.selectLoan(loan.number);
      await loanReturnPage.returnLoan(device.nameVisible, 3, "GOOD");
      await loanReturnPage.register();
      await waitForToast(page, "Devolución registrada");

      await api.waitForStock(device.id, { AVAILABLE: 6, ON_LOAN: 0 });
      expect((await api.loan(loan.id)).status).toBe("RETURNED");
    });

    test("devolver en mal estado deja la unidad como dañada", async ({
      page,
      loanReturnPage,
      scenario,
      department,
      api,
    }) => {
      const device = await scenario.device(5);
      const loan = await api.lend({
        departmentId: department.id,
        items: [{ deviceId: device.id, quantity: 3 }],
      });

      await loanReturnPage.go();
      await loanReturnPage.selectLoan(loan.number);
      await loanReturnPage.returnLoan(device.nameVisible, 2, "POOR", "Carcasa rota");
      await loanReturnPage.register();
      await waitForToast(page, "Devolución registrada");

      await api.waitForStock(device.id, { AVAILABLE: 2, ON_LOAN: 1, DAMAGED: 2 });
    });

    test("devolver como ROTO avisa la baja automática y la aplica", async ({
      page,
      loanReturnPage,
      scenario,
      department,
      api,
    }) => {
      const device = await scenario.device(5);
      const loan = await api.lend({
        departmentId: department.id,
        items: [{ deviceId: device.id, quantity: 2 }],
      });

      await loanReturnPage.go();
      await loanReturnPage.selectLoan(loan.number);
      await loanReturnPage.returnLoan(device.nameVisible, 1, "BROKEN", "Sin reparación");

      // La pantalla advierte antes de guardar.
      await expect(loanReturnPage.noticeAutomaticRetirement).toBeVisible();

      await loanReturnPage.register();
      await waitForToast(page, "Devolución registrada");

      await api.waitForStock(device.id, { AVAILABLE: 3, ON_LOAN: 1, RETIREMENT: 1 });
      const retirements = await api.movements({ deviceId: device.id, type: "RETIREMENT" });
      expect(retirements).toHaveLength(1);
      expect(retirements[0].reason).toBe("Baja automática por estado ROTO");
    });

    test("el tope a devolver es lo que queda pendiente", async ({
      loanReturnPage,
      scenario,
      department,
      api,
    }) => {
      const device = await scenario.device(8);
      const loan = await api.lend({
        departmentId: department.id,
        items: [{ deviceId: device.id, quantity: 5 }],
      });

      await loanReturnPage.go();
      await loanReturnPage.selectLoan(loan.number);

      const fieldReturn = loanReturnPage
        .block(device.nameVisible)
        .getByLabel(/^\s*Devolver\s*\*?\s*$/);
      await expect(fieldReturn).toHaveAttribute("max", "5");
    });
  });
});
