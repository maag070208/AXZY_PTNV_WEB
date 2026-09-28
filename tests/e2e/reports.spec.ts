import type { Locator, Page, Response } from "@playwright/test";
import { test, expect } from "./support/fixtures";
import { goToRoute } from "./support/pages/components";
import { E2E } from "./support/env";

/**
 * REPORTE de dispositivos desde la web — `/reportes`, tab Dispositivos.
 *
 * El dispositivo y el préstamo se siembran por API; la pantalla debe mostrar
 * responsable, depto, días y folio (nada de "—") porque el backend normaliza
 * `PRESTADO → ASIGNADO`.
 *
 * El escenario sale del fixture `escenario` (prefijo `E2E`), así que el teardown
 * de `api/` lo borra y no queda residuo entre corridas. La tabla lista TODAS las
 * unidades ordenadas `activoFijo asc` y pagina en el cliente (10 renglones por
 * página), así que la fila no cae necesariamente en la primera: se la busca
 * recorriendo las páginas, sin depender del volumen de datos.
 */
test.describe("REPORTE de dispositivos desde la web", () => {
  /**
   * Recorre las páginas de la tabla hasta encontrar la fila que contiene `texto`.
   *
   * La tabla pagina en el cliente, así que no hay filtro por columna: se avanza
   * con el control de paginación y se espera a que el cuerpo cambie de página.
   * Es estable ante el volumen de datos: si la fila estuviera más allá, se sigue
   * paginando hasta agotar las páginas.
   */
  const locateRow = async (page: Page, text: string): Promise<Locator> => {
    const row = page.locator("tr", { hasText: text }).first();
    const body = page.locator("table tbody");
    // La tabla es server-side y VIRTUALIZADA: solo monta las filas visibles, con
    // espaciadores arriba/abajo. Para encontrar la fila hay que recorrer el
    // scroller interno de la página y, al agotarla, pasar a la siguiente.
    const scroller = page.locator("table").first().locator("xpath=..");
    const next = page.locator('nav[aria-label="Pagination"] > div > div:last-child');

    const isDevicesFetch = (r: Response): boolean =>
      r.request().method() === "POST" && r.url().endsWith("/reports/devices") && r.status() === 200;

    // Página al máximo ofrecido: menos saltos de paginación.
    const firstFetch = page.waitForResponse(isDevicesFetch);
    await page.locator('select[name="itemsPerPage"]').selectOption("150");
    await firstFetch;
    await expect.poll(() => body.locator("tr").count()).toBeGreaterThan(0);

    const scrollToRow = async (): Promise<boolean> => {
      const max = await scroller.evaluate((el) => el.scrollHeight);
      const view = await scroller.evaluate((el) => el.clientHeight);
      const step = Math.max(80, view - 40);
      for (let top = 0; top <= max + step; top += step) {
        await scroller.evaluate((el, t) => {
          el.scrollTop = t;
        }, top);
        // La tabla virtualizada monta la fila de forma asíncrona tras el scroll.
        await page.waitForTimeout(60);
        if (await row.isVisible().catch(() => false)) return true;
      }
      return false;
    };

    for (let pageIndex = 0; pageIndex < 100; pageIndex += 1) {
      await scroller.evaluate((el) => {
        el.scrollTop = 0;
      });
      if (await scrollToRow()) return row;
      if ((await next.getAttribute("aria-disabled")) === "true") break;
      // Se espera a la respuesta del servidor de la SIGUIENTE página: comparar
      // el texto de la fila se confundía con el re-render por el scroll.
      const nextFetch = page.waitForResponse(isDevicesFetch);
      await next.click();
      await nextFetch;
      await expect.poll(() => body.locator("tr").count()).toBeGreaterThan(0);
    }
    return row;
  };

  test("la fila del dispositivo prestado muestra responsable, depto, días y folio", async ({
    page,
    department,
    api,
    scenario,
  }) => {
    const device = await scenario.device(1);
    const [unit] = await api.units(device.id);
    const admin = (await api.users()).find((u) => u.username === E2E.admin.username);
    expect(admin, "el usuario e2e_admin debe existir (auth.setup lo provisiona)").toBeDefined();

    const loan = await api.lend({
      custodianId: admin!.id,
      departmentId: department.id,
      items: [{ deviceId: device.id, quantity: 1 }],
    });

    await goToRoute(page, "/reports");
    await page.getByRole("button", { name: "Dispositivos" }).click();

    const row = await locateRow(page, unit.assetTag);
    await expect(row).toBeVisible();
    await expect(row).toContainText(admin!.name); // responsable
    await expect(row).toContainText(department.name); // depto
    await expect(row).toContainText(loan.number); // folio
    await expect(row).toContainText("Asignado"); // badge de estado con i18n
    // Ninguno de los cuatro campos queda como "—".
    await expect(row).not.toContainText("—");

    // Stats: la tarjeta Asignados refleja el préstamo E2E (no 0) …
    const valueAssigned = page.locator(".tab-content .text-amber-700").first();
    await expect(valueAssigned).not.toHaveText("0");
    // … y la de +30 días existe con un número (0 con préstamo recién creado).
    const valueOver30 = page.locator(".tab-content .text-red-600").first();
    await expect(valueOver30).toBeVisible();
    await expect(valueOver30).toHaveText(/^\d+$/);
  });

  test("exporta el PDF de dispositivos con el nombre esperado", async ({
    page,
    scenario,
    department,
    api,
  }) => {
    const device = await scenario.device(1);
    const admin = (await api.users()).find((u) => u.username === E2E.admin.username);
    expect(admin).toBeDefined();

    await api.lend({
      custodianId: admin!.id,
      departmentId: department.id,
      items: [{ deviceId: device.id, quantity: 1 }],
    });

    await goToRoute(page, "/reports");
    await page.getByRole("button", { name: "Dispositivos" }).click();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar PDF" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^reporte_dispositivos_\d{8}\.pdf$/);
  });
});
