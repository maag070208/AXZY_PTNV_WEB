import { test, expect } from "./support/fixtures";
import { newRunId, route } from "./support/env";

/**
 * Requerimiento del Área en la carta responsiva:
 *
 *  - REQ-B: el Área de la carta sale del departamento del responsable; si no
 *    tiene, cae a "Sistemas".
 *
 * Los usuarios se siembran por API y se borran al final; el inventario E2E lo
 * recoge el teardown de `api/`.
 */

const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** El `Área:` de la carta imprime el departamento sin el prefijo "Departamento de ". */
const areaExpected = (departmentName: string): string =>
  departmentName.replace(/^Departamento de /i, "");

const matchInsensible = (text: string): RegExp =>
  new RegExp(escapeRegex(text), "i");

test.describe("Responsable de la carta responsiva", () => {
  test("REQ-B: un empleado con departamento imprime su Área en la carta", async ({
    loanPage,
    api,
    department,
  }) => {
    const id = newRunId();
    const user = await api.createUser({
      username: `e2e_web_dept_${id}`.toLowerCase(),
      name: `E2E Depto UI ${id}`,
      departmentId: department.id,
    });
    try {
      await loanPage.go();
      await loanPage.assignToEmployee(user.name);
      await expect(loanPage.areaPreview).toHaveText(
        matchInsensible(areaExpected(department.name))
      );
    } finally {
      await api.deleteUser(user.id);
    }
  });

  test("REQ-B: un empleado sin departamento imprime Sistemas", async ({ loanPage, api }) => {
    const id = newRunId();
    const user = await api.createUser({
      username: `e2e_web_nodept_${id}`.toLowerCase(),
      name: `E2E SinDepto UI ${id}`,
    });
    try {
      await loanPage.go();
      await loanPage.assignToEmployee(user.name);
      await expect(loanPage.areaPreview).toHaveText(matchInsensible("Sistemas"));
    } finally {
      await api.deleteUser(user.id);
    }
  });

  test("REQ-B detalle: la carta del préstamo muestra el Área del responsable", async ({
    page,
    scenario,
    api,
    department,
  }) => {
    const id = newRunId();
    const user = await api.createUser({
      username: `e2e_web_det_${id}`.toLowerCase(),
      name: `E2E Detalle UI ${id}`,
      departmentId: department.id,
    });
    try {
      const device = await scenario.device(2);
      const loan = await api.lend({
        custodianId: user.id,
        items: [{ deviceId: device.id, quantity: 1 }],
      });

      await page.goto(route(`/inventory/loans/${loan.id}`));
      await expect(page.getByTestId("custody-letter-area")).toHaveText(
        matchInsensible(areaExpected(department.name))
      );
    } finally {
      await api.deleteUser(user.id);
    }
  });
});
